import { bytes } from '@oasislabs/common';
import { Deoxysii } from './aead';
import { KeyStore } from './key-store';
import nacl from './tweetnacl';
import { EncryptError } from './error';

const aead = new Deoxysii();

/**
 * Expected number of bytes of the CIPHER_LENGTH field of the ciphertext layout.
 */
const CIPHER_LEN_SIZE = 8;

/**
 * Expected number of bytes of the AAD_LENGTH field of the ciphertext layout.
 */
const AAD_LEN_SIZE = 8;

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
  if (
    ciphertext.length > Number.MAX_SAFE_INTEGER ||
    aad.length > Number.MAX_SAFE_INTEGER
  ) {
    throw new EncryptError(
      {
        nonce,
        ciphertext,
        peerPublicKey,
        publicKey,
        aad,
      },
      'ciphertext or aad may not exceed 2^53-1'
    );
  }
  return bytes.concat([
    publicKey.bytes(),
    bytes.parseNumber(ciphertext.length, CIPHER_LEN_SIZE, true),
    bytes.parseNumber(aad.length, AAD_LEN_SIZE, true),
    ciphertext,
    aad,
    nonce.bytes(),
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

  if (
    ciphertext.length > Number.MAX_SAFE_INTEGER ||
    aad.length > Number.MAX_SAFE_INTEGER
  ) {
    throw new EncryptError(
      {
        nonce,
        ciphertext,
        peerPublicKey,
        aad,
      },
      'ciphertext or aad may not exceed 2^53-1'
    );
  }

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
    aad,
  };
}

function nonce(): Nonce {
  return new Nonce(nacl.randomBytes(aead.nonceSize()));
}

/**
 * Splits the given ciphertext into it's constituent components.
 *
 * @param ciphertext is of the form:
 *        PUBLIC_KEY || CIPHER_LENGTH || AAD_LENGTH || CIPHER || AAD || NONCE
 *        where CIPHER_LENGTH and AAD_LENGTH are encoded big endian uint64
 */
export function splitEncryptedPayload(
  encryption: Uint8Array
): [PublicKey, Uint8Array, Uint8Array, Nonce] {
  if (encryption.length < ciphertextSize(0, 0)) {
    throw new Error(`ciphertext is too short: ${encryption}`);
  }
  let nonce = new Uint8Array(aead.nonceSize());
  let publicKey = new Uint8Array(aead.keySize());
  let cipherLengthOffset = aead.keySize();
  let aadLengthOffset = cipherLengthOffset + CIPHER_LEN_SIZE;
  let cipherOffset = aadLengthOffset + AAD_LEN_SIZE;

  publicKey.set(encryption.slice(0, publicKey.length));
  let cipherLength = bytes.toNumber(
    encryption.slice(cipherLengthOffset, cipherLengthOffset + CIPHER_LEN_SIZE),
    true
  );
  let aadLength = bytes.toNumber(
    encryption.slice(aadLengthOffset, aadLengthOffset + AAD_LEN_SIZE),
    true
  );

  if (encryption.length !== ciphertextSize(cipherLength, aadLength)) {
    throw new Error(`invalid ciphertext lenghth: ${encryption}`);
  }

  let ciphertext = new Uint8Array(cipherLength);

  ciphertext.set(encryption.slice(cipherOffset, cipherOffset + cipherLength));
  let aad = encryption.slice(
    cipherOffset + cipherLength,
    cipherOffset + cipherLength + aadLength
  );
  nonce.set(encryption.slice(cipherOffset + cipherLength + aadLength));

  return [new PublicKey(publicKey), ciphertext, aad, new Nonce(nonce)];
}

function ciphertextSize(cipherLen: number, aadLen: number): number {
  return (
    aead.keySize() +
    CIPHER_LEN_SIZE +
    AAD_LEN_SIZE +
    cipherLen +
    aadLen +
    aead.nonceSize()
  );
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

export class PublicKey {
  private inner: Uint8Array;

  constructor(inner: string | Uint8Array) {
    this.inner = bytes.assertLength(inner, aead.keySize());
  }

  public bytes(): Uint8Array {
    return this.inner;
  }
}

export class PrivateKey {
  private inner: Uint8Array;

  constructor(inner: string | Uint8Array) {
    this.inner = bytes.assertLength(inner, aead.keySize());
  }

  public bytes(): Uint8Array {
    return this.inner;
  }
}

export class Nonce {
  private inner: Uint8Array;

  constructor(inner: string | Uint8Array) {
    this.inner = bytes.assertLength(inner, aead.nonceSize());
  }

  public bytes(): Uint8Array {
    return this.inner;
  }
}

export { encrypt, decrypt, nonce, Deoxysii, KeyStore };
