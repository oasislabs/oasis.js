import { Address, Db } from '@oasislabs/common';
import nacl from './tweetnacl';
import { PublicKey, PrivateKey } from './';
import { KeyStoreError } from './error';

export class KeyStore {
  /**
   * db is the persistent key-value database holding the keys.
   */
  private db: Db;
  /**
   * provider is the KeyProvider to make network requests to get public keys of
   * services.
   */
  private keyProvider: KeyProvider;

  /**
   * LOCAL_KEYS is the db key where the local keypair is stored.
   */
  private static LOCAL_KEYPAIR_KEY = '@oasislabs/client/me';

  public constructor(db: Db, keyProvider: KeyProvider) {
    this.db = db;
    this.keyProvider = keyProvider;
  }

  /**
   * @returns the public key for the given service.
   */
  public async publicKey(serviceAddr: Address): Promise<PublicKey> {
    // First check the cache.
    let key = this.getCachedPublicKey(serviceAddr);
    if (key) {
      return key;
    }
    // Make a request to the keyProvider for the key.
    key = await this.getRequestPublicKey(serviceAddr);

    // Cache the key.
    this.setCachedPublicKey(serviceAddr, key);

    return key;
  }

  /**
   * @returns the cached public key if it exists.
   */
  private getCachedPublicKey(serviceAddr: Address): PublicKey | undefined {
    const key = this.db.get(serviceAddr.hex);
    if (!key) {
      return undefined;
    }
    // todo: re-enable caching: https://github.com/oasislabs/oasis.js/issues/150
    // return new PublicKey(bytes.parseHex(key));
    return undefined;
  }

  /**
   * Saves the public key in the cache.
   */
  private setCachedPublicKey(serviceAddr: Address, publicKey: PublicKey) {
    this.db.set(serviceAddr.hex, publicKey.hex);
  }

  /**
   * Makes a request to the keyProvider for the public key for the given service.
   */
  private async getRequestPublicKey(serviceAddr: Address): Promise<PublicKey> {
    const response = await this.keyProvider.publicKey({
      address: serviceAddr.bytes, // Ensure we are using Uint8Array.
    });
    if (!response.publicKey) {
      throw new KeyStoreError(
        `KeyProvider did not return a public key: ${JSON.stringify(response)}`
      );
    }
    return new PublicKey(response.publicKey);
  }

  /**
   * @returns the local keys specific to this user (not a Service). If they don't exist,
   *          create them.
   */
  public localKeys(): KeyPair {
    const serializedKeys = this.db.get(KeyStore.LOCAL_KEYPAIR_KEY);
    if (serializedKeys) {
      return KeyStore.deserializeKeyPair(serializedKeys);
    }
    const keyPair = this.newKeyPair();
    this.db.set(KeyStore.LOCAL_KEYPAIR_KEY, KeyStore.serializeKeyPair(keyPair));
    return keyPair;
  }

  public newKeyPair(): KeyPair {
    const kp = nacl.box.keyPair();
    return {
      publicKey: new PublicKey(kp.publicKey),
      privateKey: new PrivateKey(kp.secretKey),
    };
  }

  private static serializeKeyPair(keyPair: KeyPair): string {
    return JSON.stringify({
      publicKey: keyPair.publicKey.hex,
      privateKey: keyPair.privateKey.hex,
    });
  }

  private static deserializeKeyPair(keyPair: string): KeyPair {
    const kp = JSON.parse(keyPair);
    return {
      publicKey: new PublicKey(kp.publicKey),
      privateKey: new PrivateKey(kp.privateKey),
    };
  }
}

export type KeyPair = {
  publicKey: PublicKey;
  privateKey: PrivateKey;
};

export interface KeyProvider {
  publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse>;
}

export type PublicKeyRequest = {
  address: Uint8Array | string;
};

export type PublicKeyResponse = {
  publicKey?: Uint8Array;
};
