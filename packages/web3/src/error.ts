import { JsonRpcRequest } from './websocket';

export class TransactionReverted extends Error {
  constructor(readonly receipt: Record<string, any>, ...params: any[]) {
    super(...params);
  }
}

export class RpcFailure extends Error {}

export class Web3GatewayError extends Error {}

export class Web3Error extends Error {
  constructor(
    readonly method: string,
    readonly rpcParams: any[],
    ...params: any[]
  ) {
    super(...params);
  }
}

export class JsonRpcWebSocketError extends Error {
  constructor(readonly request: JsonRpcRequest, ...params: any[]) {
    super(...params);
  }
}
