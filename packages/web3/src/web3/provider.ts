import { EventEmitter } from 'eventemitter3';
import { JsonRpcWebSocket, JsonRpcResponse } from '../websocket';
import { Subscriptions } from '../subscriptions';
import { Web3Error } from '../error';
import { Wallet } from '../gateway';
import { TransactionFactory, UnpreparedTransaction } from '../transaction';

/**
 * Web3Provider is the brains behind the `Web3` class' implementation, exposing
 * the `send` method, that is responsible for making the JSON RPC request to
 * the Web3 gateway server. It acts as a sort of middle man to ensure requests
 * are handled properly and signed by a wallet when needed. Specficially, it
 *
 * - Transforms rpc requests to their desired behavior, e.g., converts
 *   eth_sendTransaction to eth_sendRawTransaction.
 * - Maintains subscription state.
 * - Executes the JSON RPC request and returns the response
 *
 * For making web3 calls, one should use the `Web3` class.
 *
 */
export default class Web3Provider {
  readonly ws: JsonRpcWebSocket;

  readonly transactions?: TransactionFactory;

  private subscriptions: Subscriptions;

  constructor(private url: string, private wallet?: Wallet) {
    this.subscriptions = new Subscriptions();
    this.ws = Web3Provider.makeWs(url, this.subscriptions);
    if (wallet) {
      this.transactions = new TransactionFactory(wallet.address, this.ws);
    }
  }

  private static makeWs(
    url: string,
    subscriptions: Subscriptions
  ): JsonRpcWebSocket {
    return new JsonRpcWebSocket(url, [subscriptions]);
  }

  /**
   * Assumes all params are properly formatted at this point.
   */
  public async send(method: string, params: any[]): Promise<any> {
    const response = await this._send(method, params);
    if (response.result === undefined) {
      throw new Web3Error(
        method,
        params,
        `error executing ${method}: ${JSON.stringify(response)}`
      );
    }
    return this.handleResponse(method, params, response.result);
  }

  private async _send(method: string, params: any[]): Promise<JsonRpcResponse> {
    if (method === 'eth_sendTransaction') {
      return this.eth_sendTransaction(method, params);
    } else if (method === 'eth_unsubscribe') {
      this.subscriptions.remove(params[0]);
      return this.ws.request({ method, params });
    } else {
      return this.ws.request({ method, params });
    }
  }

  /**
   * Transforms all calls to eth_sendTransaction to signed calls to
   * eth_sendRawTransaction.
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  private async eth_sendTransaction(
    method: string,
    params: any[]
  ): Promise<JsonRpcResponse> {
    if (!this.wallet) {
      throw new Web3Error(
        method,
        params,
        `must have a wallet to execute eth_sendTransaction`
      );
    }
    const tx = await this.transactions!.create(
      params[0] as UnpreparedTransaction
    );
    const rawTx = await this.wallet.sign(tx);
    return this.ws.request({
      method: 'eth_sendRawTransaction',
      params: [rawTx],
    });
  }

  private async handleResponse(
    rpcMethod: string,
    params: any[],
    response: any
  ): Promise<any> {
    if (rpcMethod === 'eth_subscribe') {
      return this.subscribeResponse(response);
    } else {
      return response;
    }
  }

  private subscribeResponse(subscriptionId: string) {
    const subscription = new Subscription(subscriptionId);

    this.subscriptions.add(subscriptionId, (event: any) => {
      subscription.emit('data', event.params.result);
    });

    return subscription;
  }
}

export class Subscription extends EventEmitter {
  /**
   * @param `id` is the subscription id given by the remote web3 gateway.
   */
  constructor(readonly id: string) {
    super();
  }

  unsubscribe() {
    throw new Error('unsubscribe is not implemented');
  }

  subscribe() {
    throw new Error('subscribe is not implemented');
  }
}
