import { Interface } from 'ethers/utils/interface';
import { Idl, RpcFn } from '../idl';
import { Bytes4, Bytes } from '../types';
import { RpcCoder, RpcRequest } from './';
import * as bytes from '../utils/bytes';

export class EthereumCoder implements RpcCoder {
  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    // @ts-ignore
    let iface = new Interface([fn]);
    return iface.functions[fn.name].encode(args);
  }

  public async decode(data: Bytes, constructor?: boolean): Promise<RpcRequest> {
    // todo
    // @ts-ignore
    return {};
  }

  public async initcode(
    abi: Idl,
    params: any[],
    bytecode: Bytes
  ): Promise<Bytes> {
    // @ts-ignore
    let iface = new Interface(abi);
    return iface.deployFunction.encode(bytes.toHex(bytecode), params);
  }

  public functions(idl: Idl): RpcFn[] {
    return idl.filter(fn => fn.type === 'function');
  }
}
