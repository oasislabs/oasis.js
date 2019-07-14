import { EventEmitter } from 'eventemitter3';
import { keccak256 } from 'js-sha3';
import { bytes, sleep } from '@oasislabs/common';
import {
  OasisGateway,
  DeployRequest,
  DeployResponse,
  RpcRequest,
  RpcResponse,
  SubscribeRequest,
  UnsubscribeRequest,
  PublicKeyRequest,
  PublicKeyResponse,
  GetCodeRequest,
  GetCodeResponse
} from '@oasislabs/service';
import { JsonRpcWebSocket } from './websocket';
import { TransactionFactory, Transaction } from './transaction';
import { Subscriptions } from './subscriptions';

export class Web3Gateway implements OasisGateway {
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
    let txParams = Object.assign(request.options || {}, {
      value: '0x00',
      data: bytes.toHex(request.data)
    });
    let tx = await this.transactions.create(txParams);
    let rawTx = await this.wallet.sign(tx);
    let txHash = (await this.ws.request({
      method: 'eth_sendRawTransaction',
      params: [rawTx]
    })).result;
    let receipt = (await this.ws.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    })).result;

    // TODO: https://github.com/oasislabs/oasis-client/issues/103
    let tries = 0;
    while (!receipt && tries < 5) {
      await sleep(1000);
      receipt = (await this.ws.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })).result;
      tries += 1;
    }
    if (!receipt) {
      throw new Error('Could not fetch the transaction receipt');
    }

    return {
      address: bytes.parseHex(receipt.contractAddress)
    };
  }

  async rpc(request: RpcRequest): Promise<RpcResponse> {
    let txParams = Object.assign(request.options || {}, {
      value: '0x00',
      data: bytes.toHex(request.data),
      to: bytes.toHex(request.address!)
    });
    let tx = await this.transactions.create(txParams);
    let rawTx = await this.wallet.sign(tx);
    let executionPayload = (await this.ws.request({
      method: 'oasis_invoke',
      params: [rawTx]
    })).result;

    let error = undefined;

    // If the transaction reverted, throw an Error with the message given from
    // the runtime.
    if (executionPayload.status === '0x0') {
      error = bytes.parseHex(executionPayload.output);
    }

    return {
      output: executionPayload.output,
      error
    };
  }

  subscribe(request: SubscribeRequest): any {
    return this.web3Subscribe(request.event, [
      'logs',
      {
        address: bytes.toHex(request.filter!.address),
        topics: request.filter!.topics.map(t => bytes.toHex(t))
      }
    ]);
  }

  web3Subscribe(eventName: string, params: any[]): any {
    let events = new EventEmitter();
    this.ws
      .request({
        method: 'eth_subscribe',
        params
      })
      .then(response => {
        this.subscriptions.add(eventName, response.result, event => {
          events.emit(eventName, event.params.result);
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
    let response = (await this.ws.request({
      method: 'oasis_getPublicKey',
      params: [bytes.toHex(request.address)]
    })).result;
    // TODO: signature validation. https://github.com/oasislabs/oasis-client/issues/39
    return {
      publicKey: bytes.parseHex(response.public_key)
    };
  }

  public disconnect() {
    this.ws.disconnect();
  }

  public async getCode(request: GetCodeRequest): Promise<GetCodeResponse> {
    let response = await this.ws.request({
      method: 'eth_getCode',
      params: [bytes.toHex(request.address), 'latest']
    });
    // todo: throw cleaner error when code doesn't exist
    return {
      code: bytes.parseHex(response.result)
    };
  }
}

export default interface Wallet {
  sign(tx: Transaction): Promise<string>;
  address: string;
}
