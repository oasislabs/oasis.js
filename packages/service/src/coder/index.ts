import { Bytes4, Bytes } from '@oasis/types';
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
  decode(fn: RpcFn, data: Bytes, constructor?: boolean): Promise<any>;
}

interface RpcFunctions {
  functions(idl: Idl): RpcFn[];
}

interface RpcInitcode {
  initcode(idl: Idl, params: any[], bytecode: Bytes): Promise<Bytes>;
}

interface RpcSubscribeTopic {
  topic(event: string, idl: Idl): string;
}

export type RpcRequest = {
  method: string;
  payload: any[];
};

interface RpcSubscriptionEventDecoder {
  decodeSubscriptionEvent(e: any, idl: Idl): any;
}
