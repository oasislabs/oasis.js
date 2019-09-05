import { bytes, Db } from '@oasislabs/common';
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
  private static LOCAL_KEYPAIR_KEY: string = '@oasislabs/client/me';

  public constructor(db: Db, keyProvider: KeyProvider) {
    this.db = db;
    this.keyProvider = keyProvider;
  }

  /**
   * @returns the public key for the given service.
   */
  public async publicKey(service: Uint8Array | string): Promise<PublicKey> {
    // First check the cache.
    let key = this.getCachedPublicKey(service);
    if (key) {
      return key;
    }
    // Make a request to the keyProvider for the key.
    key = await this.getRequestPublicKey(service);

    // Cache the key.
    this.setCachedPublicKey(service, key);

    return key;
  }

  /**
   * @returns the cached public key if it exists.
   */
  private getCachedPublicKey(
    service: Uint8Array | string
  ): PublicKey | undefined {
    service = typeof service === 'string' ? service : bytes.toHex(service);
    let key = this.db.get(service);
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
  private setCachedPublicKey(
    service: Uint8Array | string,
    publicKey: PublicKey
  ) {
    service = typeof service === 'string' ? service : bytes.toHex(service);
    let value = bytes.toHex(publicKey.bytes());
    this.db.set(service, value);
  }

  /**
   * Makes a request to the keyProvider for the public key for the given service.
   */
  private async getRequestPublicKey(
    service: Uint8Array | string
  ): Promise<PublicKey> {
    // Ensure we are using Uint8Array.
    service = typeof service !== 'string' ? service : bytes.parseHex(service);
    let response = await this.keyProvider.publicKey({ address: service });
    if (!response.publicKey) {
      throw new KeyStoreError(
        `KeyProvider did not return a public key: ${response}`
      );
    }
    return new PublicKey(response.publicKey);
  }

  /**
   * @returns the local keys specific to this user (not a Service). If they don't exist,
   *          create them.
   */
  public localKeys(): KeyPair {
    let serializedKeys = this.db.get(KeyStore.LOCAL_KEYPAIR_KEY);
    if (serializedKeys) {
      return KeyStore.deserializeKeyPair(serializedKeys);
    }
    let keyPair = this.newKeyPair();
    this.db.set(KeyStore.LOCAL_KEYPAIR_KEY, KeyStore.serializeKeyPair(keyPair));
    return keyPair;
  }

  public newKeyPair(): KeyPair {
    let kp = nacl.box.keyPair();
    return {
      publicKey: new PublicKey(kp.publicKey),
      privateKey: new PrivateKey(kp.secretKey),
    };
  }

  private static serializeKeyPair(keyPair: KeyPair): string {
    return JSON.stringify({
      publicKey: bytes.toHex(keyPair.publicKey.bytes()),
      privateKey: bytes.toHex(keyPair.privateKey.bytes()),
    });
  }

  private static deserializeKeyPair(keyPair: string): KeyPair {
    let kp = JSON.parse(keyPair);
    return {
      publicKey: new PublicKey(bytes.parseHex(kp.publicKey)),
      privateKey: new PrivateKey(bytes.parseHex(kp.privateKey)),
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
