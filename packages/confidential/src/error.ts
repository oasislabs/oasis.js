import { Nonce, PublicKey } from '.';

export class EncryptError extends Error {
  constructor(readonly encParams: EncryptionParams, ...params: any[]) {
    super(...params);
  }
}

type EncryptionParams = {
  nonce: Nonce;
  ciphertext: Uint8Array;
  peerPublicKey: PublicKey;
  publicKey?: PublicKey;
  aad: Uint8Array;
};

export class KeyStoreError extends Error {}
