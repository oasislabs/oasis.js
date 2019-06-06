import { keccak256 } from 'js-sha3';
import { Interface } from 'ethers/utils/interface';
import { Bytes4, Bytes } from '@oasis/types';
import { bytes } from '@oasis/common';
import { RpcCoder, RpcRequest, Idl, RpcFn, AeadKeys } from '@oasis/service';
import { RpcOptions } from '@oasis/service';

export class EthereumCoder implements RpcCoder {
  public async encode(
    fn: RpcFn,
    args: any[],
    _options?: RpcOptions
  ): Promise<Uint8Array> {
    // @ts-ignore
    let iface = new Interface([fn]);
    // @ts-ignore
    return iface.functions[fn.name].encode(args);
  }

  public async decode(
    fn: RpcFn,
    data: Bytes,
    constructor?: boolean
  ): Promise<any> {
    // @ts-ignore
    let iface = new Interface([fn]);
    // @ts-ignore
    let output = iface.functions[fn.name].decode(data);
    // @ts-ignore
    if (fn.outputs.length === 1) {
      return output[0];
    }
    return output;
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

  public topic(event: string, idl: Idl): string {
    let format = sighashFormat(event, idl);
    return keccak256(format);
  }

  public decodeSubscriptionEvent(log: any, abi: Idl): any {
    let iface = new Interface(abi as any[]);
    return iface.parseLog(log).values;
  }
}

export function sighashFormat(event: string, idl: Idl): string {
  let items = idl.filter(fn => fn.type === 'event' && fn.name === event);
  if (items.length !== 1) {
    throw new Error(`Must have a single event for ${event}`);
  }
  let inputs = items[0].inputs.map(i => i.type).join(',');
  return `${event}(${inputs})`;
}
