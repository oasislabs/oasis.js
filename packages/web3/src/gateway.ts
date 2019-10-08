import { EventEmitter } from 'eventemitter3';
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
  GetCodeResponse,
} from '@oasislabs/service';
import { Transaction } from './transaction';
import { Web3GatewayError, TransactionReverted, RpcFailure } from './error';
import { Web3, Web3Provider, Web3Namespace } from './web3';

export default class Web3Gateway implements OasisGateway {
  /**
   * Private variables used to manage the gateway.
   */
  private _inner: Web3GatewayInner;

  /**
   * `eth_*` web3 rpc methods.
   */
  public eth: Web3Namespace;

  /**
   * `oasis_*` web3 rpc methods.
   */
  public oasis: Web3Namespace;

  /**
   * `net_*` web3 rpc methods.
   */
  public net: Web3Namespace;

  constructor(url: string, wallet?: Wallet) {
    this._inner = this.setupInner(url, wallet);
    this.eth = this._inner.web3.eth;
    this.oasis = this._inner.web3.oasis;
    this.net = this._inner.web3.net;
  }

  private setupInner(url: string, wallet?: Wallet): Web3GatewayInner {
    const web3 = new Web3(new Web3Provider(url, wallet));
    const subscriptionIds = new Map();

    return {
      wallet,
      web3,
      subscriptionIds,
    };
  }

  /**
   * Sanity check that the gateway is constructed with the correct url.
   */
  private assertGatewayIsResponsive(url: string): Promise<undefined> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Couldn't connect to gateway ${url}`));
      }, 3000);

      return this.net.version().then((response: any) => {
        if (parseInt(response, 10) <= 0) {
          reject(new Error(`Invalid gateway response ${response}`));
        }
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    if (!this._inner.wallet) {
      throw new Web3GatewayError(
        'The Web3Gateway must have a Wallet to deploy'
      );
    }

    const txParams = Object.assign(request.options || {}, {
      data: bytes.toHex(request.data),
    });
    const tx = await this._inner.web3.provider.transactions!.create(txParams);
    const rawTx = await this._inner.wallet.sign(tx);
    const txHash = await this.eth.sendRawTransaction(rawTx);
    let receipt = await this.eth.getTransactionReceipt(txHash);

    // TODO: https://github.com/oasislabs/oasis-client/issues/103
    let tries = 0;
    while (!receipt && tries < 5) {
      await sleep(1000);
      receipt = await this.eth.getTransactionReceipt(txHash);
      tries += 1;
    }
    if (!receipt) {
      throw new RpcFailure('could not fetch the transaction receipt');
    }

    if (receipt.status !== '0x1') {
      throw new TransactionReverted(
        receipt,
        `transaction reverted: ${JSON.stringify(receipt, null, 2)}`
      );
    }

    return {
      address: bytes.parseHex(receipt.contractAddress),
    };
  }

  async rpc(request: RpcRequest): Promise<RpcResponse> {
    if (!this._inner.wallet) {
      throw new Web3GatewayError(
        'The Web3Gateway must have a Wallet to execute an rpc'
      );
    }

    const txParams = Object.assign(request.options || {}, {
      data: bytes.toHex(request.data),
      to: bytes.toHex(request.address!),
    });
    const tx = await this._inner.web3.provider.transactions!.create(txParams);
    const rawTx = await this._inner.wallet.sign(tx);
    const executionPayload = await this.oasis.invoke(rawTx);

    let error = undefined;

    // If the transaction reverted, throw an Error with the message given from
    // the runtime.
    if (executionPayload.status === '0x0') {
      error = bytes.parseHex(executionPayload.output);
    }

    return {
      output: executionPayload.output,
      error,
    };
  }

  subscribe(request: SubscribeRequest): any {
    return this.web3Subscribe(request.event, [
      'logs',
      {
        address: bytes.toHex(request.filter!.address),
        topics: request.filter!.topics,
      },
    ]);
  }

  web3Subscribe(eventName: string, params: any[]): any {
    const events = new EventEmitter();

    this.eth
      .subscribe(...params)
      .then((sub: any) => {
        // Set this mapping to allow clients to `unsubscribe` with an event
        // name, instead of an id.
        this._inner.subscriptionIds.set(eventName, sub.id);
        // Remap web3 `data` event to the given event name.
        sub.on('data', (event: any) => {
          events.emit(eventName, event);
        });
      })
      .catch(console.error);

    return events;
  }

  async unsubscribe(request: UnsubscribeRequest) {
    const id = this._inner.subscriptionIds.get(request.event);
    if (!id) {
      return;
    }
    this._inner.subscriptionIds.delete(request.event);
    return this.eth.unsubscribe(id);
  }

  async publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse> {
    const response = await this.oasis.getPublicKey(
      bytes.toHex(request.address)
    );
    // TODO: signature validation. https://github.com/oasislabs/oasis-client/issues/39
    return {
      publicKey: bytes.parseHex(response.public_key),
    };
  }

  public disconnect() {
    this._inner.web3.provider.ws.disconnect();
  }

  public async getCode(request: GetCodeRequest): Promise<GetCodeResponse> {
    const response = await this.eth.getCode(
      bytes.toHex(request.address),
      'latest'
    );

    // Note: the gateway returns '0x' for all addresses without code.
    return {
      code: response === '0x' ? null : bytes.parseHex(response),
    };
  }

  // todo: https://github.com/oasislabs/oasis.js/issues/25
  public connectionState(): any {
    return this._inner.web3.provider.ws.connectionState;
  }

  public hasSigner(): boolean {
    return true;
  }
}

type Web3GatewayInner = {
  /**
   * Maps event names to subscriptionIds.
   */
  subscriptionIds: Map<string, number>;

  /**
   * Wallet for signing transactions.
   */
  wallet?: Wallet;

  /**
   * Web3 rpcs.
   */
  web3: Web3;
};

export interface Wallet {
  sign(tx: Transaction): Promise<string>;
  address: string;
}
