import { Nonce, PublicKey, PrivateKey } from '@oasis/types';
import { bytes } from '@oasis/common';
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
  aad: string
): Promise<Uint8Array> {
  let ciphertext = await aead.seal(
    nonce,
    plaintext,
    new Uint8Array([]),
    peerPublicKey,
    privateKey
  );
  return bytes.concat([
    publicKey,
    bytes.parseNumber(ciphertext.length, 8),
    bytes.parseNumber(aad.length, 8),
    ciphertext,
    bytes.encodeUtf8(aad),
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
  let [nonce, peerPublicKey, ciphertext, aad] = splitEncryptedPayload(
    encryption
  );
  let plaintext = await aead.open(
    nonce,
    ciphertext,
    Uint8Array.from([]),
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
function splitEncryptedPayload(
  encryption: Uint8Array
): [Uint8Array, Uint8Array, Uint8Array, string] {
  if (encryption.length < 64) {
    throw new Error(`Invalid encryption: ${encryption}`);
  }
  let nonce = new Uint8Array(15);
  let publicKey = new Uint8Array(32);
  let cipherLengthOffset = 32;
  let aadLengthOffset = cipherLengthOffset + 8;
  let cipherOffset = aadLengthOffset + 8;

  publicKey.set(encryption.slice(0, publicKey.length));
  let cipherLength = parseInt(
    bytes.toHex(encryption.slice(cipherLengthOffset, cipherLengthOffset + 8)),
    16
  );
  let aadLength = parseInt(
    bytes.toHex(encryption.slice(aadLengthOffset, aadLengthOffset + 8)),
    16
  );

  let ciphertext = new Uint8Array(cipherLength);

  ciphertext.set(encryption.slice(cipherOffset, cipherOffset + cipherLength));
  let aad = bytes.decodeUtf8(
    encryption.slice(
      cipherOffset + cipherLength,
      cipherOffset + cipherLength + aadLength
    )
  );
  nonce.set(encryption.slice(cipherOffset + cipherLength + aadLength));

  return [nonce, publicKey, ciphertext, aad];
}

type Decryption = {
  nonce: Nonce;
  plaintext: Uint8Array;
  peerPublicKey: PublicKey;
  aad: string;
};

export type AeadKeys = {
  peerPublicKey: PublicKey;
  publicKey: PublicKey;
  privateKey: PrivateKey;
};

export { encrypt, decrypt, nonce, Deoxysii, KeyStore };
