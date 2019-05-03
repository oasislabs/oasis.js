import { Nonce, PublicKey, PrivateKey } from '../types';
import { ecdhTweak } from './ecdh-tweak';
import * as deoxysii from 'deoxysii';

export interface Aead {
  seal(
    nonce: Nonce,
    plaintext: Uint8Array,
    additionalData: Uint8Array,
    peerPublicKey: PublicKey,
    privateKey: PrivateKey
  ): Promise<Uint8Array>;

  open(
    nonce: Nonce,
    ciphertext: Uint8Array,
    additionalData: Uint8Array,
    peerPublicKey: PublicKey,
    privateKey: PrivateKey
  ): Promise<Uint8Array>;
}

export class Deoxysii implements Aead {
  public async seal(
    nonce: Nonce,
    plaintext: Uint8Array,
    additionalData: Uint8Array,
    peerPublicKey: PublicKey,
    privateKey: PrivateKey
  ): Promise<Uint8Array> {
    let aesKey = await ecdhTweak(peerPublicKey, privateKey);
    let aead = new deoxysii.AEAD(aesKey);
    return aead.encrypt(nonce, plaintext, additionalData);
  }

  public async open(
    nonce: Nonce,
    ciphertext: Uint8Array,
    additionalData: Uint8Array,
    peerPublicKey: PublicKey,
    privateKey: PrivateKey
  ): Promise<Uint8Array> {
    let aesKey = await ecdhTweak(peerPublicKey, privateKey);
    let aead = new deoxysii.AEAD(aesKey);
    return aead.decrypt(nonce, ciphertext, additionalData);
  }
}
