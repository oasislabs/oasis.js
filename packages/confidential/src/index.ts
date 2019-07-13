import { Nonce, PublicKey, PrivateKey } from '@oasislabs/types';
import { bytes } from '@oasislabs/common';
import { Deoxysii } from './aead';
import { KeyStore } from './key-store';
import nacl from './tweetnacl';

const aead = new Deoxysii();

/**
 * encrypt takes the given input and returns the encrypted wire format:
 * PUBLIC_KEY || CIPHER_LENGTH || AAD_LENGTH || CIPHER || AAD || NONCE
 * where CIPHER_LENGTH and AAD_LENGTH are encoded big endian uint64
 */
async function encrypt(
  nonce: Nonce,
  plaintext: Uint8Array,
  peerPublicKey: PublicKey,
  publicKey: PublicKey,
  privateKey: PrivateKey,
  aad: Uint8Array
): Promise<Uint8Array> {
  let ciphertext = await aead.seal(
    nonce,
    plaintext,
    aad,
    peerPublicKey,
    privateKey
  );
  /*
  console.log('plain = ', plaintext);
  console.log('nonce = ', nonce);
  console.log('cipher = ', ciphertext);
  console.log('aad = ', aad);
  console.log('publicKey = ', publicKey);
  console.log('peerPublicKey = ', peerPublicKey);
  console.log('privateKey = ', privateKey);
  */
  return bytes.concat([
    publicKey,
    bytes.parseNumber(ciphertext.length, 8, true),
    bytes.parseNumber(aad.length, 8, true),
    ciphertext,
    aad,
    nonce
  ]);
}

/**
 * decrypt takes the given input and returns the unpacked Decryption payload.
 *
 * @param ciphertext is of the form NONCE || PUBLIC_KEY || CIPHER.
 */
async function decrypt(
  encryption: Uint8Array,
  secretKey: PrivateKey
): Promise<Decryption> {
  let [peerPublicKey, ciphertext, aad, nonce] = splitEncryptedPayload(
    encryption
  );
  let plaintext = await aead.open(
    nonce,
    ciphertext,
    aad,
    peerPublicKey,
    secretKey
  );
  return {
    nonce,
    plaintext,
    peerPublicKey,
    aad
  };
}

function nonce(): Nonce {
  return nacl.randomBytes(15);
}

/**
 * Splits the given ciphertext into it's constituent components.
 *
 * @param ciphertext is of the form:
 * PUBLIC_KEY || CIPHER_LENGTH || AAD_LENGTH || CIPHER || AAD || NONCE
 * where CIPHER_LENGTH and AAD_LENGTH are encoded big endian uint64
 */
export function splitEncryptedPayload(
  encryption: Uint8Array
): [Uint8Array, Uint8Array, Uint8Array, Uint8Array] {
  if (encryption.length < 64) {
    throw new Error(`Invalid encryption: ${encryption}`);
  }
  let nonce = new Uint8Array(15);
  let publicKey = new Uint8Array(32);
  let cipherLengthOffset = 32;
  let aadLengthOffset = cipherLengthOffset + 8;
  let cipherOffset = aadLengthOffset + 8;

  publicKey.set(encryption.slice(0, publicKey.length));
  let cipherLength = bytes.toNumber(
    encryption.slice(cipherLengthOffset, cipherLengthOffset + 8),
    true
  );
  let aadLength = bytes.toNumber(
    encryption.slice(aadLengthOffset, aadLengthOffset + 8),
    true
  );
  let ciphertext = new Uint8Array(cipherLength);

  ciphertext.set(encryption.slice(cipherOffset, cipherOffset + cipherLength));
  let aad = encryption.slice(
    cipherOffset + cipherLength,
    cipherOffset + cipherLength + aadLength
  );
  nonce.set(encryption.slice(cipherOffset + cipherLength + aadLength));

  return [publicKey, ciphertext, aad, nonce];
}

type Decryption = {
  nonce: Nonce;
  plaintext: Uint8Array;
  peerPublicKey: PublicKey;
  aad: Uint8Array;
};

export type AeadKeys = {
  peerPublicKey: PublicKey;
  publicKey: PublicKey;
  privateKey: PrivateKey;
};

export { encrypt, decrypt, nonce, Deoxysii, KeyStore };
