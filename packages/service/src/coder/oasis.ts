import camelCaseKeys from 'camelcase-keys';
import { keccak256 } from 'js-sha3';
import { AeadKeys } from '@oasislabs/confidential';
import { bytes, cbor } from '@oasislabs/common';
import { Idl, RpcFn } from '../idl';
import ConfidentialCoder from './confidential';
import { RpcCoder, RpcEncoder, RpcDecoder } from './';
import { RpcOptions } from '../oasis-gateway';

/**
 * RpcCoder encodes and decodes service rpc requests. Use the static factory methods to
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
    data: Uint8Array,
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

  public topic(event: string, _idl: Idl): string {
    return '0x' + keccak256(event);
  }

  public async decodeSubscriptionEvent(e: any, _idl: Idl): Promise<any> {
    const event = cbor.decode(bytes.parseHex(e.data));
    return camelCaseKeys(event, { deep: true });
  }

  public async initcode(
    idl: Idl,
    params: any[],
    bytecode: Uint8Array
  ): Promise<Uint8Array> {
    const constructorArgs = idl.constructor.inputs;

    if (constructorArgs.length === 0) {
      return bytecode;
    }

    const args = await this.encode(
      { name: 'constructor', inputs: constructorArgs },
      params || []
    );
    const b = bytecode;
    return bytes.concat([b, args]);
  }

  /**
   * Factory method returning a confidential RpcCoder.
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
    const expectedLen = fn.inputs ? fn.inputs.length : 0;
    if (expectedLen !== args.length) {
      throw new Error(`Invalid arguments ${JSON.stringify(args)}`);
    }

    // TODO: input validation. https://github.com/oasislabs/oasis-client/issues/14

    if (fn.name === 'constructor') {
      return cbor.encode(args);
    }

    return cbor.encode({
      method: fn.name,
      payload: args,
    });
  }
}

export class PlaintextRpcDecoder {
  async decode(
    fn: RpcFn,
    data: Uint8Array,
    _constructor?: boolean
  ): Promise<any> {
    return cbor.decode(data);
  }

  public async decodeError(error: Uint8Array): Promise<string> {
    return bytes.decodeUtf8(error);
  }
}
