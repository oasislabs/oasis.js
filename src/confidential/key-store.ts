import { Address, PublicKey, PrivateKey } from '../types';
import { Db } from '../db';
import { OasisGateway, defaultOasisGateway } from '../oasis-gateway';
import * as bytes from '../utils/bytes';
import nacl from '../utils/tweetnacl';

export default class KeyStore {
  /**
   * db is the persistent key-value database holding the keys.
   */
  private db: Db;
  /**
   * provider is the Provider to make network requests to get public keys of
   * services.
   */
  private gateway: OasisGateway;

  /**
   * LOCAL_KEYS is the db key where the local keypair is stored.
   */
  private static LOCAL_KEYPAIR_KEY: string = 'me';

  public constructor(db: Db, gateway?: OasisGateway) {
    this.db = db;
    if (!gateway) {
      this.gateway = defaultOasisGateway();
    } else {
      this.gateway = gateway;
    }
  }

  /**
   * @returns the public key for the given service.
   */
  public async publicKey(service: Address): Promise<PublicKey | undefined> {
    // First check the cache.
    let key = this.getCachedPublicKey(service);
    if (key) {
      return key;
    }
    // Make a request to the gateway for the key.
    key = await this.getRequestPublicKey(service);
    if (!key) {
      return undefined;
    }

    // Cache the key.
    this.setCachedPublicKey(service, key);

    return key;
  }

  /**
   * @returns the cached public key if it exists.
   */
  private getCachedPublicKey(service: Address): PublicKey | undefined {
    service = typeof service === 'string' ? service : bytes.toHex(service);
    let key = this.db.get(service);
    if (!key) {
      return undefined;
    }
    return bytes.parseHex(key);
  }

  /**
   * Saves the public key in the cache.
   */
  private setCachedPublicKey(service: Address, publicKey: PublicKey) {
    service = typeof service === 'string' ? service : bytes.toHex(service);
    let value = bytes.toHex(publicKey);
    this.db.set(service, value);
  }

  /**
   * Makes a request to the gateway for the public key for the given service.
   */
  private async getRequestPublicKey(
    service: Address
  ): Promise<PublicKey | undefined> {
    // Ensure we are using Uint8Array.
    service = typeof service !== 'string' ? service : bytes.parseHex(service);
    let response = await this.gateway.publicKey({ address: service });
    if (!response.publicKey) {
      return undefined;
    }
    return response.publicKey;
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
      publicKey: kp.publicKey,
      privateKey: kp.secretKey
    };
  }

  private static serializeKeyPair(keyPair: KeyPair): string {
    return JSON.stringify({
      publicKey: bytes.toHex(keyPair.publicKey),
      privateKey: bytes.toHex(keyPair.privateKey)
    });
  }

  private static deserializeKeyPair(keyPair: string): KeyPair {
    let kp = JSON.parse(keyPair);
    return {
      publicKey: bytes.parseHex(kp.publicKey),
      privateKey: bytes.parseHex(kp.privateKey)
    };
  }
}

export type KeyPair = {
  publicKey: PublicKey;
  privateKey: PrivateKey;
};
