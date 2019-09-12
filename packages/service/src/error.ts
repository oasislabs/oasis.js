import { bytes } from '@oasislabs/common';
import { RpcOptions } from './oasis-gateway';

export function NO_CODE_ERROR_MSG(address: Uint8Array): string {
  return `
    No code exists for address ${bytes.toHex(address)}.
    Either your address is incorrect or the deploy failed.
  `;
}

export class RpcError extends Error {
  constructor(
    readonly rpcArgs: any[],
    readonly rpcOptions?: RpcOptions,
    ...params: any[]
  ) {
    super(...params);
  }
}

export class DeployError extends Error {
  constructor(readonly deployArgs: any[], ...params: any[]) {
    super(...params);
  }
}

export class ServiceError extends Error {
  constructor(readonly address: Uint8Array, ...params: any[]) {
    super(...params);
  }
}
