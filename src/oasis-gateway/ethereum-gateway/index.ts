import * as EventEmitter from 'eventemitter3';
import * as bytes from '../../utils/bytes';
import {
  OasisGateway,
  DeployRequest,
  DeployResponse,
  RpcRequest,
  RpcResponse,
  SubscribeRequest,
  UnsubscribeRequest,
  PublicKeyRequest,
  PublicKeyResponse
} from '../';
import { JsonRpcWebSocket } from './websocket';
import { TransactionFactory, Transaction } from './transaction';
import { Subscriptions } from './subscriptions';
import keccak256 from '../../utils/keccak256';

export class EthereumGateway implements OasisGateway {
  /**
   * Websocket connection to the remote gateway.
   */
  private ws: JsonRpcWebSocket;

  /**
   * Subscription middleware for the websocket connection.
   */
  private subscriptions: Subscriptions;

  /**
   * Builds well formed transactions that are ready for signing.
   */
  private transactions: TransactionFactory;

  /**
   * Wallet for signing transactions.
   */
  private wallet: Wallet;

  constructor(url: string, wallet: Wallet) {
    this.subscriptions = new Subscriptions();
    this.ws = new JsonRpcWebSocket(url, [this.subscriptions]);
    this.wallet = wallet;
    this.transactions = new TransactionFactory(this.wallet.address, this.ws);
  }

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    let tx = await this.transactions.create({
      value: '0x00',
      data: bytes.toHex(request.data)
    });
    let rawTx = await this.wallet.sign(tx);
    let txHash = (await this.ws.request({
      method: 'eth_sendRawTransaction',
      params: [rawTx]
    })).result;
    let receipt = (await this.ws.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    })).result;

    return {
      address: bytes.parseHex(receipt.contractAddress)
    };
  }

  async rpc(request: RpcRequest): Promise<RpcResponse> {
    let tx = await this.transactions.create({
      value: '0x00',
      data: bytes.toHex(request.data),
      to: bytes.toHex(request.address!)
    });
    let rawTx = await this.wallet.sign(tx);
    let txHash = (await this.ws.request({
      method: 'eth_sendRawTransaction',
      params: [rawTx]
    })).result;

    return {
      output: txHash
    };
  }

  subscribe(request: SubscribeRequest): EventEmitter {
    let events = new EventEmitter();
    this.ws
      .request({
        method: 'eth_subscribe',
        params: [
          'logs',
          {
            address: bytes.toHex(request.filter!.address),
            topics: request.filter!.topics.map(t => bytes.toHex(t))
          }
        ]
      })
      .then(response => {
        this.subscriptions.add(request.event, response.result, event => {
          events.emit(request.event, event.params.result);
        });
      })
      .catch(console.error);

    return events;
  }

  async unsubscribe(request: UnsubscribeRequest) {
    let id = this.subscriptions.remove(request.event);
    if (!id) {
      return;
    }
    let response = await this.ws.request({
      method: 'eth_unsubscribe',
      params: [id]
    });

    if (!response.result) {
      throw new Error(
        `failed to unsubscribe with request ${request} and response ${response}`
      );
    }
  }

  async publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse> {
    let response = await this.ws.request({
      method: 'oasis_getPublicKey',
      params: [request.address]
    });
    // TODO: signature validation. https://github.com/oasislabs/oasis-client/issues/39
    return {
      publicKey: response.result.publicKey
    };
  }

  public disconnect() {
    this.ws.disconnect();
  }
}

interface Wallet {
  sign(tx: Transaction): Promise<string>;
  address: string;
}
