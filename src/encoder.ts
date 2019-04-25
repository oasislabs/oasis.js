import { RpcFn } from './idl';
import { H256, Bytes4, Bytes } from './types';

const cbor = require('cbor');
const keccak256 = require('keccak256');

export interface RpcEncoder {
  encode(fn: RpcFn, args: any[]): Promise<Buffer>;
}

export class PlaintextRpcEncoder implements RpcEncoder {
  public async encode(fn: RpcFn, args: any[]): Promise<Buffer> {
    if (fn.inputs.length !== args.length) {
      throw new Error(`Invalid arguments ${JSON.stringify(args)}`);
    }

    // TODO: input validation. https://github.com/oasislabs/oasis-client/issues/14

    let sighash = Sighash.from(fn);
    let cborEncoded = cbor.encode(args);

    return Buffer.concat([sighash, cborEncoded]);
  }
}

class ConfidentialRpcEncoder extends PlaintextRpcEncoder {
  /**
   * @overrides PlaintextRpcEncoder, encrypting the data after encoding it.
   */
  public async encode(fn: RpcFn, args: any[]): Promise<Buffer> {
    let data = await super.encode(fn, args);
    return this.encrypt(data);
  }

  private async encrypt(data: Buffer): Promise<Buffer> {
    // TODO: https://github.com/oasislabs/oasis-client/issues/4
    return data;
  }
}

class Sighash {
  public static from(fn: RpcFn): Bytes4 {
    let sighash = keccak256(Sighash.format(fn));
    return sighash.slice(0, 4);
  }

  /**
   * @param   fn is an idl input field.
   * @returns a string in the form of a sighash preimage.
   */
  public static format(fn: RpcFn): string {
    let name = fn.name;

    let inputs = ''; // TODO. See https://github.com/oasislabs/oasis-client/issues/15.

    return `${name}(${inputs})`;
  }
}
