import { Idl, RpcFn } from '../idl';
import { Address, H256, Bytes4, Bytes, PublicKey, PrivateKey } from '../types';
import * as bytes from '../utils/bytes';
import cbor from '../utils/cbor';
import keccak256 from '../utils/keccak256';
import { AeadKeys, KeyStore, nonce, encrypt, decrypt } from '../confidential';
import { RpcCoder, RpcEncoder, RpcDecoder, RpcRequest } from './';

/**
 * RpcCoder encodes and decodes serivce rpc requests. Use the static factory methods to
 * construct an instance.
 */
export class OasisCoder implements RpcCoder {
  constructor(private encoder: RpcEncoder, private decoder: RpcDecoder) {}

  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    return this.encoder.encode(fn, args);
  }

  public async decode(
    fn: RpcFn,
    data: Bytes,
    constructor?: boolean
  ): Promise<any> {
    return this.decoder.decode(fn, data, constructor);
  }

  public functions(idl: Idl): RpcFn[] {
    return idl.functions;
  }

  public topic(event: string, idl: Idl): string {
    return keccak256(event);
  }

  public decodeSubscriptionEvent(e: any, idl: Idl): any {
    return cbor.decode(
      bytes.parseHex(
        JSON.parse(Buffer.from(e.data, 'hex').toString('utf-8')).data
      )
    );
  }

  public async initcode(
    idl: Idl,
    params: any[],
    bytecode: Bytes
  ): Promise<Bytes> {
    let constructorArgs = idl.constructor.inputs;
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
  public static confidential(keys: AeadKeys): OasisCoder {
    return new OasisCoder(
      new ConfidentialRpcEncoder(keys),
      new ConfidentialRpcDecoder(keys.privateKey)
    );
  }

  /**
   * Factory method returning a non-confidential RpcCoder.
   */
  public static plaintext(): OasisCoder {
    return new OasisCoder(new PlaintextRpcEncoder(), new PlaintextRpcDecoder());
  }
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

export class PlaintextRpcDecoder {
  async decode(fn: RpcFn, data: Bytes, constructor?: boolean): Promise<any> {
    // TODO: https://github.com/oasislabs/oasis-client/issues/57
    return data;
  }
}

export class ConfidentialRpcEncoder extends PlaintextRpcEncoder {
  public constructor(private keys: AeadKeys) {
    super();
  }
  /**
   * @overrides PlaintextRpcEncoder, encrypting the data after encoding it.
   */
  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    let data = await super.encode(fn, args);
    return encrypt(
      nonce(),
      data,
      this.keys.peerPublicKey,
      this.keys.publicKey,
      this.keys.privateKey
    );
  }
}

export class Sighash {
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

    let inputs = fn.inputs
      .map(i => (i.type === 'defined' ? i.params.type : i.type))
      .join(',');

    return `${name}(${inputs})`;
  }
}

export class ConfidentialRpcDecoder extends PlaintextRpcDecoder {
  constructor(private privateKey: PrivateKey) {
    super();
  }

  async decode(
    fn: RpcFn,
    encrypted: Bytes,
    constructor?: boolean
  ): Promise<any> {
    if (constructor) {
      // Constructor rpcs aren't encrypted.
      return super.decode(fn, encrypted, constructor);
    }
    if (typeof encrypted === 'string') {
      encrypted = bytes.parseHex(encrypted);
    }
    let decryption = await decrypt(encrypted, this.privateKey);
    return super.decode(fn, decryption.plaintext, constructor);
  }
}
