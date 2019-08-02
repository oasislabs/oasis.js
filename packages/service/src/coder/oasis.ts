import { keccak256 } from 'js-sha3';
import { AeadKeys } from '@oasislabs/confidential';
import { bytes, cbor } from '@oasislabs/common';
import {
  Address,
  H256,
  Bytes4,
  Bytes,
  PublicKey,
  PrivateKey
} from '@oasislabs/types';
import { Idl, RpcFn } from '../idl';
import ConfidentialCoder from './confidential';
import { RpcCoder, RpcEncoder, RpcDecoder, RpcRequest } from './';
import { RpcOptions } from '../oasis-gateway';

/**
 * RpcCoder encodes and decodes serivce rpc requests. Use the static factory methods to
 * construct an instance.
 */
export class OasisCoder implements RpcCoder {
  constructor(private encoder: RpcEncoder, private decoder: RpcDecoder) {}

  public async encode(
    fn: RpcFn,
    args: any[],
    options?: RpcOptions
  ): Promise<Uint8Array> {
    return this.encoder.encode(fn, args, options);
  }

  public async decode(
    fn: RpcFn,
    data: Bytes,
    constructor?: boolean
  ): Promise<any> {
    return this.decoder.decode(fn, data, constructor);
  }

  public async decodeError(error: Uint8Array): Promise<string> {
    return this.decoder.decodeError(error);
  }

  public functions(idl: Idl): RpcFn[] {
    return idl.functions;
  }

  public topic(event: string, idl: Idl): string {
    return keccak256(event);
  }

  public async decodeSubscriptionEvent(e: any, idl: Idl): Promise<any> {
    return cbor.decode(bytes.parseHex(e.data));
  }

  public async initcode(
    idl: Idl,
    params: any[],
    bytecode: Bytes
  ): Promise<Bytes> {
    let constructorArgs = idl.constructor.inputs;

    if (constructorArgs.length === 0) {
      return bytecode;
    }

    let args = await this.encode(
      { name: 'constructor', inputs: constructorArgs },
      params || []
    );
    let b = bytecode as Uint8Array;
    return bytes.concat([b, args]);
  }

  /**
   * Facotry method returning a confidential RpcCoder.
   */
  public static confidential(keys: AeadKeys): RpcCoder {
    return new ConfidentialCoder(keys, OasisCoder.plaintext());
  }

  /**
   * Factory method returning a non-confidential RpcCoder.
   */
  public static plaintext(): RpcCoder {
    return new OasisCoder(new PlaintextRpcEncoder(), new PlaintextRpcDecoder());
  }
}

export class PlaintextRpcEncoder implements RpcEncoder {
  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    let expectedLen = fn.inputs ? fn.inputs.length : 0;
    if (expectedLen !== args.length) {
      throw new Error(`Invalid arguments ${JSON.stringify(args)}`);
    }

    // TODO: input validation. https://github.com/oasislabs/oasis-client/issues/14

    for (let k = 0; k < args.length; k += 1) {
      let input = fn.inputs[k];

      // If we hit the inner most if statements, here, the type to encode must
      // be a fixed length byte array, e.g., Address.
      //
      // In such cases, we allow three input types, to represent the fixed
      // length byte array:
      //
      // 1) Array.
      // 2) Uint8Array, which we convert to an Array.
      // 3) Hex String, which we convert to an Array.
      //
      // Note that this is just a convenience so that the service APIs are
      // easier to use in the JavaScript wild, e.g., where one might copy and
      // paste a hex string. A more sane API would be to provide and enforce
      // explicit types mirroring the Rust's runtime types, e.g., Address,
      // transforming the apis to something like
      //
      // `service.myMethod(oasis.types.Address.from('0x...'))`.
      //
      // But we don't live in a sane world.
      //
      // Note: I've commented out the check on `input.type.type !== 'bytes` because
      //       oasis-rs rejects cbor encoding a Uint8Array to represent a Vec<u8>.
      //       If it ever changes, we should uncomment this.
      //       See https://github.com/oasislabs/oasis-rs/issues/184.
      if (/*input.type.type !== 'bytes' && */ input.type.type !== 'string') {
        let givenArg = args[k];

        // Hex string representation.
        if (givenArg.constructor === String) {
          args[k] = Array.from(bytes.parseHex(givenArg));
        }
        // Uint8Array representation.
        else if (givenArg.constructor === Uint8Array) {
          args[k] = Array.from(givenArg);
        }

        // Else
        // * the user gave a fixed length array--all good.
        // * the type is not a fixed length array type--all good.
      }
    }

    if (fn.name === 'constructor') {
      return cbor.encode(args);
    }

    return cbor.encode({
      method: fn.name,
      payload: args
    });
  }
}

export class PlaintextRpcDecoder {
  async decode(fn: RpcFn, data: Bytes, constructor?: boolean): Promise<any> {
    if (typeof data === 'string') {
      data = bytes.parseHex(data);
    }
    return cbor.decode(data);
  }

  public async decodeError(error: Uint8Array): Promise<string> {
    return bytes.decodeUtf8(error);
  }
}
