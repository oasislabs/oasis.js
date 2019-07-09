import EventEmitter from 'eventemitter3';
import { Address, PublicKey, Bytes } from '@oasis/types';

/**
 * OasisGateway is the client's interface used to access services running on Oasis.
 */
export interface OasisGateway {
  deploy(request: DeployRequest): Promise<DeployResponse>;
  rpc(request: RpcRequest): Promise<RpcResponse>;
  subscribe(request: SubscribeRequest): EventEmitter;
  unsubscribe(request: UnsubscribeRequest);
  publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse>;
  getCode(request: GetCodeRequest): Promise<GetCodeResponse>;
}

export type DeployRequest = {
  data: Bytes;
  options?: RpcOptions;
};

export type DeployResponse = {
  address: Address;
};

export type PublicKeyRequest = {
  address: Address;
};

export type GetCodeRequest = {
  address: Address;
};

export type GetCodeResponse = {
  code: Uint8Array;
};

export type RpcRequest = {
  data: Bytes;
  address?: Address;
  options?: RpcOptions;
};

export type RpcOptions = {
  gasLimit?: string;
  gasPrice?: string;
  aad?: string;
};

export type RpcResponse = {
  output: any;
};

export type SubscribeRequest = {
  event: string;
  filter?: SubscribeFilter;
};

export type SubscribeFilter = {
  address: Address;
  topics: Bytes[];
};

export type UnsubscribeRequest = {
  event: string;
};

export type PublicKeyResponse = {
  publicKey?: PublicKey;
};

export const SubscribeTopic = 'subscription';

/**
 * The default gateway to use if no gateway is provided to the service.
 * This *must* be set before using a service.
 */
let _defaultGateway: OasisGateway | undefined = undefined;

/**
 * Connect sets the default oasis gateway so that all services use it
 * unless explicity overriden upon construction of the service.
 */
export function connect(gw: OasisGateway) {
  _defaultGateway = gw;
}

export function defaultOasisGateway(): OasisGateway {
  if (!_defaultGateway) {
    throw new Error('the client is not connected to an OasisGateway');
  }
  return _defaultGateway;
}
