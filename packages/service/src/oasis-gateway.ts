import EventEmitter from 'eventemitter3';

/**
 * OasisGateway is the client's interface used to access services running on Oasis.
 */
export interface OasisGateway {
  deploy(request: DeployRequest): Promise<DeployResponse>;
  rpc(request: RpcRequest): Promise<RpcResponse>;
  subscribe(request: SubscribeRequest): EventEmitter;
  unsubscribe(request: UnsubscribeRequest): void;
  publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse>;
  getCode(request: GetCodeRequest): Promise<GetCodeResponse>;
  disconnect(): void;
  /**
   * For implementations that manage reconnection internally, this emits advisory
   * events about its internal connection status:
   * - `trouble` when it experiences repeated problems connecting
   * - `ok` when it reconnects after having emitted a `trouble` event
   */
  connectionState(): EventEmitter;

  /**
   * @returns true iff the gateway has a wallet to sign and construct raw
   *          transactions.
   */
  hasSigner(): boolean;
}

export type DeployRequest = {
  data: Uint8Array;
  options?: RpcOptions;
};

export type DeployResponse = {
  address: Uint8Array;
};

export type PublicKeyRequest = {
  address: Uint8Array;
};

export type GetCodeRequest = {
  address: Uint8Array;
};

export type GetCodeResponse = {
  code: Uint8Array | null;
};

export type RpcRequest = {
  data: Uint8Array;
  address?: Uint8Array;
  options?: RpcOptions;
};

export type RpcOptions = {
  gasLimit?: string | number;
  gasPrice?: string | number;
  value?: string | number;
  aad?: string;
};

export type RpcResponse = {
  output: any;
  error?: Uint8Array;
};

export type SubscribeRequest = {
  event: string;
  filter?: SubscribeFilter;
};

export type SubscribeFilter = {
  address: Uint8Array;
  topics: string[];
};

export type UnsubscribeRequest = {
  event: string;
};

export type PublicKeyResponse = {
  publicKey?: Uint8Array;
};

export const SubscribeTopic = 'subscription';

/**
 * The default gateway to use if no gateway is provided to the service.
 * This *must* be set before using a service.
 */
let _defaultGateway: OasisGateway | undefined = undefined;

/**
 * setGateway sets the default oasis gateway so that all services use it
 * unless explicitly overridden upon construction of the service.
 */
export function setGateway(gw: OasisGateway) {
  _defaultGateway = gw;
}

export function defaultOasisGateway(): OasisGateway {
  if (!_defaultGateway) {
    throw new Error('the client is not connected to an OasisGateway');
  }
  return _defaultGateway;
}
