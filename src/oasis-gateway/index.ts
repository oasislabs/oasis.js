import { Address, PublicKey, Bytes } from '../types';
import DeveloperGateway from './developer-gateway';
import * as EventEmitter from 'eventemitter3';

/**
 * OasisGateway is the client's interface used to access services running on Oasis.
 */
export interface OasisGateway {
  deploy(request: DeployRequest): Promise<DeployResponse>;
  rpc(request: RpcRequest): Promise<RpcResponse>;
  subscribe(request: SubscribeRequest): EventEmitter;
  unsubscribe(request: UnsubscribeRequest);
  publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse>;
}

export type DeployRequest = {
  data: Bytes;
};

export type DeployResponse = {
  address: Address;
};

export type PublicKeyRequest = {
  address: Address;
};

export type RpcRequest = {
  data: Bytes;
  address?: Address;
};

export type RpcResponse = {
  output: any;
};

export type SubscribeRequest = {
  event: string;
  filter?: Object;
};

export type UnsubscribeRequest = {
  event: string;
};

export type PublicKeyResponse = {
  publicKey?: PublicKey;
};

export const SubscribeTopic = 'subscription';

export function defaultOasisGateway(): OasisGateway {
  return DeveloperGateway.http('http://localhost:1234');
}
