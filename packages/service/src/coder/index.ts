import { Idl, RpcFn } from '../idl';
import { RpcOptions } from '../oasis-gateway';

export type RpcCoder = RpcEncoder &
  RpcDecoder &
  RpcFunctions &
  RpcInitcode &
  RpcSubscribeTopic &
  RpcSubscriptionEventDecoder;

export interface RpcEncoder {
  encode(fn: RpcFn, args: any[], options?: RpcOptions): Promise<Uint8Array>;
}

export interface RpcDecoder {
  decode(
    fn: RpcFn,
    data: Uint8Array | string,
    constructor?: boolean
  ): Promise<any>;
  decodeError(error: Uint8Array): Promise<string>;
}

interface RpcFunctions {
  functions(idl: Idl): RpcFn[];
}

interface RpcInitcode {
  initcode(
    idl: Idl,
    params: any[],
    bytecode: Uint8Array | string
  ): Promise<Uint8Array | string>;
}

interface RpcSubscribeTopic {
  topic(event: string, idl: Idl): string;
}

export type RpcRequest = {
  method: string;
  payload: any[];
};

interface RpcSubscriptionEventDecoder {
  decodeSubscriptionEvent(e: any, idl: Idl): Promise<any>;
}
