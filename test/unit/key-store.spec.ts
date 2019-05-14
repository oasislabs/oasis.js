import KeyStore from '../../src/confidential/key-store';
import { DummyStorage } from '../../src/db';
import { PublicKeyMockProvider } from './utils';
import * as bytes from '../../src/utils/bytes';

describe('KeyStore', () => {
  describe('publicKey', () => {
    it('gets the public key for an uncached service and then caches it', async () => {
      let keyStore = new KeyStore(
        new DummyStorage(),
        new PublicKeyMockProvider()
      );

      let service = PublicKeyMockProvider.address;
      let key = await keyStore.publicKey(service);
      expect(key).toEqual(PublicKeyMockProvider._publicKey);
      // @ts-ignore
      expect(keyStore.db.get(PublicKeyMockProvider.address)).toEqual(
        bytes.toHex(PublicKeyMockProvider._publicKey)
      );
    });

    it('generates local keys and then caches it', () => {
      let keyStore = new KeyStore(
        new DummyStorage(),
        new PublicKeyMockProvider()
      );
      let local = keyStore.localKeys();
      expect(local.publicKey.length).toEqual(32);
      // @ts-ignore
      let cachedLocal = keyStore.db.get(KeyStore.LOCAL_KEYPAIR_KEY);
      // @ts-ignore
      expect(cachedLocal).toEqual(KeyStore.serializeKeyPair(local));
    });
  });
});
