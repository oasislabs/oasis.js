import { Nonce, PublicKey, PrivateKey } from '@oasislabs/types';

export class EncryptError extends Error {
  constructor(readonly encParams: EncryptionParams, ...params) {
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
