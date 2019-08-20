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
import { TransactionReverted, RpcFailure } from './error';

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

  /**
   * Sanity check that the gateway is constructed with the correct url.
   */
  private assertGatewayIsResponsive(url: string): Promise<undefined> {
    return new Promise(async (resolve, reject) => {
      let timeout = setTimeout(() => {
        reject(new Error(`Couldn't connect to gateway ${url}`));
      }, 3000);

      let response = await this.ws.request({
        method: 'net_version',
        params: []
      });

      if (!response.result || parseInt(response.result, 10) <= 0) {
        reject(new Error(`Invalid gateway response ${response}`));
      }

      clearTimeout(timeout);

      resolve();
    });
  }

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    let txParams = Object.assign(request.options || {}, {
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
      throw new RpcFailure('could not fetch the transaction receipt');
    }

    if (receipt.status !== '0x1') {
      throw new TransactionReverted(
        receipt,
        `transaction reverted: ${receipt}`
      );
    }

    return {
      address: bytes.parseHex(receipt.contractAddress)
    };
  }

  async rpc(request: RpcRequest): Promise<RpcResponse> {
    let txParams = Object.assign(request.options || {}, {
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
      throw new RpcFailure(
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

  // todo: https://github.com/oasislabs/oasis.js/issues/25
  public connectionState(): any {
    return this.ws.connectionState;
  }

  public hasSigner(): boolean {
    return true;
  }
}

export default interface Wallet {
  sign(tx: Transaction): Promise<string>;
  address: string;
}
