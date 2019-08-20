import { JsonRpcRequest } from './websocket';
export class TransactionReverted extends Error {
  constructor(readonly receipt: Object, ...params) {
    super(...params);
  }
}

export class RpcFailure extends Error {}

export class JsonRpcWebSocketError extends Error {
  constructor(readonly JsonRpcRequest, ...params) {
    super(...params);
  }
}
