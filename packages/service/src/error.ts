import { RpcOptions } from './oasis-gateway';

export class RpcError extends Error {
  constructor(
    readonly rpcArgs: any[],
    readonly rpcOptions?: RpcOptions,
    ...params: any[]
  ) {
    super(...params);
  }
}
