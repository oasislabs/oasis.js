import { AeadKeys, nonce, encrypt, decrypt } from '@oasislabs/confidential';
import { bytes } from '@oasislabs/common';

import { Idl, RpcFn } from '../idl';
import { RpcCoder } from './';
import { RpcOptions } from '../oasis-gateway';

/**
 * Wraps a coder to encrypt/decrypt encoded messages in addition to coding.
 */
export default class ConfidentialCoder {
  constructor(private keys: AeadKeys, private internalCoder: RpcCoder) {}

  public async encode(
    fn: RpcFn,
    args: any[],
    options?: RpcOptions
  ): Promise<Uint8Array> {
    const aad = !options || !options.aad ? '' : options.aad;
    const data = await this.internalCoder.encode(fn, args, options);
    return encrypt(
      nonce(),
      data,
      this.keys.peerPublicKey,
      this.keys.publicKey,
      this.keys.privateKey,
      bytes.encodeUtf8(aad)
    );
  }

  public async decode(
    fn: RpcFn,
    encrypted: Uint8Array,
    constructor?: boolean
  ): Promise<any> {
    if (constructor) {
      // Constructor rpcs aren't encrypted.
      return this.internalCoder.decode(fn, encrypted, constructor);
    }
    const decryption = await decrypt(encrypted, this.keys.privateKey);
    return this.internalCoder.decode(fn, decryption.plaintext, constructor);
  }

  public async decodeError(error: Uint8Array): Promise<string> {
    const decryption = await decrypt(error, this.keys.privateKey);
    return this.internalCoder.decodeError(decryption.plaintext);
  }

  public async initcode(
    abi: Idl,
    params: any[],
    bytecode: Uint8Array
  ): Promise<Uint8Array> {
    return this.internalCoder.initcode(abi, params, bytecode);
  }

  public functions(idl: Idl): RpcFn[] {
    return this.internalCoder.functions(idl);
  }

  public topic(event: string, idl: Idl): string {
    return this.internalCoder.topic(event, idl);
  }

  public async decodeSubscriptionEvent(log: any, abi: Idl): Promise<any> {
    return this.internalCoder.decodeSubscriptionEvent(log, abi);
  }
}
