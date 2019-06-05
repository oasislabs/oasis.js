import { Address, PublicKey, Bytes, EventEmitter } from '@oasis/types';

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
  options?: RpcOptions;
};

export type RpcOptions = {
  gasLimit: string;
  gasPrice: string;
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

export function setDefaultOasisGateway(gw: OasisGateway) {
  _defaultGateway = gw;
}

//  return DeveloperGateway.http('http://localhost:1234');
export function defaultOasisGateway(): OasisGateway {
  if (!_defaultGateway) {
    throw new Error('the default gateway has not been set');
  }
  return _defaultGateway;
}
