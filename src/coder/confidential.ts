import { Idl, RpcFn } from '../idl';
import { Bytes, PublicKey, PrivateKey } from '../types';
import * as bytes from '../utils/bytes';
import { AeadKeys, KeyStore, nonce, encrypt, decrypt } from '../confidential';
import { RpcCoder } from './';

/**
 * Wraps a coder to decrypt/decrypt encoded messages in addition to coding.
 */
export default class ConfidentialCoder {
  constructor(private keys: AeadKeys, private internalCoder: RpcCoder) {}

  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    let data = await this.internalCoder.encode(fn, args);
    return encrypt(
      nonce(),
      data,
      this.keys.peerPublicKey,
      this.keys.publicKey,
      this.keys.privateKey
    );
  }

  public async decode(
    fn: RpcFn,
    encrypted: Bytes,
    constructor?: boolean
  ): Promise<any> {
    if (constructor) {
      // Constructor rpcs aren't encrypted.
      return this.internalCoder.decode(fn, encrypted, constructor);
    }
    if (typeof encrypted === 'string') {
      encrypted = bytes.parseHex(encrypted);
    }
    let decryption = await decrypt(encrypted, this.keys.privateKey);
    return this.internalCoder.decode(fn, decryption.plaintext, constructor);
  }

  public async initcode(
    abi: Idl,
    params: any[],
    bytecode: Bytes
  ): Promise<Bytes> {
    return this.internalCoder.initcode(abi, params, bytecode);
  }

  public functions(idl: Idl): RpcFn[] {
    return this.internalCoder.functions(idl);
  }

  public topic(event: string, idl: Idl): string {
    return this.internalCoder.topic(event, idl);
  }

  public decodeSubscriptionEvent(log: any, abi: Idl): any {
    return this.internalCoder.topic(log, abi);
  }
}
