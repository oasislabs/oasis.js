import { Address, bytes, DummyStorage } from '@oasislabs/common';
import {
  KeyStore,
  KeyProvider,
  PublicKeyRequest,
  PublicKeyResponse,
} from '../src/key-store';

describe('KeyStore', () => {
  describe('publicKey', () => {
    it('gets the public key for an uncached service and then caches it', async () => {
      const keyStore = new KeyStore(
        new DummyStorage(),
        new PublicKeyMockProvider()
      );

      const key = await keyStore.publicKey(PublicKeyMockProvider.address);
      expect(key!.bytes).toEqual(PublicKeyMockProvider._publicKey);
      // @ts-ignore
      expect(keyStore.db.get(PublicKeyMockProvider.address.hex)).toEqual(
        bytes.toHex(PublicKeyMockProvider._publicKey)
      );
    });

    it('generates local keys and then caches it', () => {
      const keyStore = new KeyStore(
        new DummyStorage(),
        new PublicKeyMockProvider()
      );
      const local = keyStore.localKeys();
      expect(local.publicKey.bytes.length).toEqual(32);
      // @ts-ignore
      const cachedLocal = keyStore.db.get(KeyStore.LOCAL_KEYPAIR_KEY);
      // @ts-ignore
      expect(cachedLocal).toEqual(KeyStore.serializeKeyPair(local));
    });
  });
});

export class PublicKeyMockProvider implements KeyProvider {
  public static _publicKey = new Uint8Array([
    212,
    68,
    31,
    146,
    81,
    149,
    55,
    148,
    122,
    149,
    152,
    112,
    75,
    10,
    165,
    224,
    0,
    223,
    142,
    70,
    148,
    92,
    150,
    1,
    245,
    166,
    152,
    125,
    32,
    138,
    118,
    115,
  ]);

  public static address = new Address(
    '0x5c7b817e80680fec250a6f638c504d39ad353b26'
  );

  async publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse> {
    const reqAddr = new Address(request.address);
    if (reqAddr.hex !== PublicKeyMockProvider.address.hex) {
      throw new Error(
        `Unexpected data. Expected ${PublicKeyMockProvider.address.hex} got ${reqAddr.hex}`
      );
    }

    return { publicKey: PublicKeyMockProvider._publicKey };
  }
}
