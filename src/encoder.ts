import { RpcFn } from './idl';
import { H256, Bytes4, Bytes } from './types';
import * as bytes from './utils/bytes';
import cbor from './utils/cbor';
import keccak256 from './utils/keccak256';

export interface RpcEncoder {
  encode(fn: RpcFn, args: any[]): Promise<Uint8Array>;
}

export class PlaintextRpcEncoder implements RpcEncoder {
  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    if (fn.inputs.length !== args.length) {
      throw new Error(`Invalid arguments ${JSON.stringify(args)}`);
    }

    // TODO: input validation. https://github.com/oasislabs/oasis-client/issues/14

    let cborEncoded = cbor.encode(args);

    if (fn.name === 'constructor') {
      return cborEncoded;
    }

    let sighash = Sighash.from(fn);
    return bytes.concat([sighash, cborEncoded]);
  }
}

class ConfidentialRpcEncoder extends PlaintextRpcEncoder {
  /**
   * @overrides PlaintextRpcEncoder, encrypting the data after encoding it.
   */
  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    let data = await super.encode(fn, args);
    return this.encrypt(data);
  }

  private async encrypt(data: Uint8Array): Promise<Uint8Array> {
    // TODO: https://github.com/oasislabs/oasis-client/issues/4
    return data;
  }
}

class Sighash {
  public static from(fn: RpcFn): Bytes4 {
    let sighash = bytes.parseHex(keccak256(Sighash.format(fn)));
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
