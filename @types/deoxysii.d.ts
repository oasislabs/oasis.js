declare module 'deoxysii' {
  class AEAD {
	constructor(aesKey: Uint8Array);
	encrypt(nonce: Uint8Array, plaintext?: Uint8Array, associatedData?: Uint8Array): Uint8Array;
	decrypt(nonce: Uint8Array, ciphertext: Uint8Array, associatedData: Uint8Array): Uint8Array;
  }
}
