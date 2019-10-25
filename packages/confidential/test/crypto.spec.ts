import { bytes } from '@oasislabs/common';
import { Nonce, PublicKey, PrivateKey } from '../src';

import { encrypt, decrypt, splitEncryptedPayload } from '../src';
import nacl from '../src/tweetnacl';

describe('Crypto', () => {
  it('Decrypts the encrypted data', async () => {
    const plaintext = new Uint8Array([1, 2, 3, 4]);

    const [nonce, peer, me, aad] = aeadInput();

    const encryption = await encrypt(
      nonce,
      plaintext,
      me.publicKey,
      peer.publicKey,
      peer.privateKey,
      aad
    );

    const decryption = await decrypt(encryption, me.privateKey);

    expect(decryption.nonce).toEqual(nonce);
    expect(decryption.peerPublicKey).toEqual(peer.publicKey);
    expect(decryption.plaintext).toEqual(plaintext);
    expect(decryption.aad.toString()).toEqual(aad.toString());
  });

  it('Encrypts the data to the wire format', async () => {
    const plaintext = new Uint8Array([
      162,
      102,
      109,
      101,
      116,
      104,
      111,
      100,
      105,
      103,
      101,
      116,
      95,
      99,
      111,
      117,
      110,
      116,
      103,
      112,
      97,
      121,
      108,
      111,
      97,
      100,
      128,
    ]);
    const nonce = new Uint8Array([
      14,
      165,
      160,
      215,
      103,
      91,
      206,
      119,
      15,
      74,
      214,
      123,
      232,
      84,
      170,
    ]);
    const peerPublicKey = new Uint8Array([
      116,
      62,
      180,
      232,
      196,
      202,
      38,
      123,
      204,
      182,
      183,
      208,
      42,
      238,
      138,
      235,
      97,
      158,
      6,
      56,
      67,
      218,
      180,
      81,
      211,
      152,
      176,
      51,
      238,
      30,
      55,
      109,
    ]);
    const publicKey = new Uint8Array([
      83,
      125,
      217,
      210,
      225,
      137,
      127,
      56,
      153,
      220,
      253,
      125,
      188,
      172,
      163,
      73,
      246,
      57,
      29,
      39,
      182,
      74,
      231,
      116,
      254,
      171,
      193,
      96,
      110,
      163,
      207,
      27,
    ]);
    const secretKey = new Uint8Array([
      157,
      82,
      192,
      70,
      250,
      242,
      226,
      96,
      56,
      82,
      254,
      189,
      233,
      199,
      2,
      51,
      128,
      199,
      118,
      173,
      31,
      99,
      163,
      187,
      13,
      167,
      46,
      191,
      153,
      141,
      237,
      54,
    ]);
    const aad = new Uint8Array([]);

    const encryption = await encrypt(
      new Nonce(nonce),
      plaintext,
      new PublicKey(peerPublicKey),
      new PublicKey(publicKey),
      new PrivateKey(secretKey),
      aad
    );
    const [splitPublicKey, , splitAad, splitNonce] = splitEncryptedPayload(
      encryption
    );

    expect(splitPublicKey.bytes).toEqual(publicKey);
    expect(splitAad).toEqual(aad);
    expect(splitNonce.bytes).toEqual(nonce);
  });
});

function aeadInput(): [Nonce, KeyPair, KeyPair, Uint8Array] {
  const keyPair = nacl.box.keyPair();
  const me = {
    publicKey: new PublicKey(keyPair.publicKey),
    privateKey: new PrivateKey(keyPair.secretKey),
  };

  const peerKeyPair = nacl.box.keyPair();
  const peer = {
    publicKey: new PublicKey(peerKeyPair.publicKey),
    privateKey: new PrivateKey(peerKeyPair.secretKey),
  };

  const nonce = new Nonce(nacl.randomBytes(15));

  const aad = bytes.encodeUtf8('some_aad');

  return [nonce, peer, me, aad];
}

type KeyPair = {
  publicKey: PublicKey;
  privateKey: PrivateKey;
};
