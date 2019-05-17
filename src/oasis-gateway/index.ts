import { Address, PublicKey, Bytes } from '../types';
import DeveloperGateway from './developer-gateway';
import * as EventEmitter from 'eventemitter3';

/**
 * OasisGateway is the client's interface used to access services running on Oasis.
 */
export interface OasisGateway {
  rpc(request: RpcRequest): Promise<any>;
  subscribe(request: SubscribeRequest): EventEmitter;
  publicKey(address: Address): Promise<PublicKey | undefined>;
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
  return DeveloperGateway.http('http://localhost:1234');
}
