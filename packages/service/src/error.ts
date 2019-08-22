export class RpcError extends Error {
  constructor(readonly rpcArgs, readonly rpcOptions, ...params) {
    super(...params);
  }
}
