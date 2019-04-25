import { Rpc } from './types';
import { Idl, RpcFn, RpcInput } from './idl';
import { ServiceOptions } from './service';
const cbor = require('cbor');

export default class RpcFactory {
  public constructor(private options: ServiceOptions) {}

  /**
   * @returns an rpc function that transparently validates and
   */
  public rpc(idl: Idl, fn: RpcFn): Rpc {
    return async (...args: any[]) => {
      let serialized = RpcEncoder.encode(fn, args);
      return RpcRequest.send(fn, serialized);
    };
  }
}

export class RpcEncoder {
  public static encode(fn: RpcFn, args: any[]): Buffer {
    if (fn.inputs.length !== args.length) {
      throw new Error(`Invalid arguments ${JSON.stringify(args)}`);
    }

    // TODO: input validation.

    let jsonEncoded = JSON.parse(JSON.stringify(args));
    let cborEncoded = cbor.encode(jsonEncoded);

    let data = {
      name: RpcEncoder.sighash(fn),
      input: cborEncoded
    };

    return cbor.encode(data);
  }

  // TODO: do we want even sighash? Redo this with whatever we decide to use.
  public static sighash(fn: RpcFn): Buffer {
    const keccak256 = require('keccak256');
    let name = fn.name;
    // TODO: serialize args if we decide to use sighash.
    let inputs = '';
    let input = `${name}()`;
    return keccak256(input);
  }
}

class RpcRequest {
  public static async send(fn: RpcFn, serializedRpc: Buffer): Promise<any> {
    // todo
    return 0;
  }
}
