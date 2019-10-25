import * as deoxysii from 'deoxysii';
import { Nonce, PublicKey, PrivateKey } from '.';
import { ecdhTweak } from './ecdh-tweak';

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

  nonceSize(): number;

  keySize(): number;
}

export class Deoxysii implements Aead {
  public async seal(
    nonce: Nonce,
    plaintext: Uint8Array,
    additionalData: Uint8Array,
    peerPublicKey: PublicKey,
    privateKey: PrivateKey
  ): Promise<Uint8Array> {
    const aesKey = await ecdhTweak(peerPublicKey, privateKey);
    const aead = new deoxysii.AEAD(aesKey);
    return aead.encrypt(nonce.bytes, plaintext, additionalData);
  }

  public async open(
    nonce: Nonce,
    ciphertext: Uint8Array,
    additionalData: Uint8Array,
    peerPublicKey: PublicKey,
    privateKey: PrivateKey
  ): Promise<Uint8Array> {
    const aesKey = await ecdhTweak(peerPublicKey, privateKey);
    const aead = new deoxysii.AEAD(aesKey);
    return aead.decrypt(nonce.bytes, ciphertext, additionalData);
  }

  public nonceSize(): number {
    return deoxysii.NonceSize;
  }

  public keySize(): number {
    return deoxysii.KeySize;
  }
}
