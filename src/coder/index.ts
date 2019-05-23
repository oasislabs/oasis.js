import { Idl, RpcFn } from '../idl';
import { Bytes4, Bytes } from '../types';

export type RpcCoder = RpcEncoder & RpcDecoder & RpcFunctions & RpcInitcode;

export interface RpcEncoder {
  encode(fn: RpcFn, args: any[]): Promise<Uint8Array>;
}

export interface RpcDecoder {
  decode(data: Bytes, constructor?: boolean): Promise<RpcRequest>;
}

interface RpcFunctions {
  functions(idl: Idl): RpcFn[];
}

interface RpcInitcode {
  initcode(idl: Idl, params: any[], bytecode: Bytes): Promise<Bytes>;
}

export type RpcRequest = {
  sighash?: Bytes4;
  input: any[];
};
