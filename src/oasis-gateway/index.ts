import { Address, PublicKey, Bytes } from '../../src/types';
import * as EventEmitter from 'eventemitter3';

/**
 * OasisGateway is the client's interface used to access services running on Oasis.
 */
export interface OasisGateway {
  rpc(request: RpcRequest): Promise<any>;
  subscribe(request: SubscribeRequest): EventEmitter;
  publicKey(address: Address): Promise<PublicKey | undefined>;
}

export class HttpGateway implements OasisGateway {
  public constructor(private url: string) {}

  public async rpc(request: RpcRequest): Promise<any> {
    // TODO
  }

  public subscribe(request: SubscribeRequest): EventEmitter {
    // TODO
    return new EventEmitter();
  }

  public async publicKey(address: Address): Promise<PublicKey | undefined> {
    // todo
    return undefined;
  }
}

export type RpcRequest = {
  data: Bytes;
  address?: Address;
};

export type SubscribeRequest = {
  event: string;
  filter?: Object;
};

export function defaultOasisGateway(): OasisGateway {
  return new HttpGateway('https://web3.oasiscloud.io/');
}
