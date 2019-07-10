import { Nonce, PublicKey, PrivateKey } from '@oasislabs/types';
import { bytes } from '@oasislabs/common';

import { encrypt, decrypt } from '../src';
import nacl from '../src/tweetnacl';

describe('Crypto', () => {
  it('Encrypts to the wire format', async () => {
    let plaintext = new Uint8Array([1, 2, 3, 4]);

    let [nonce, peer, me, aad] = aeadInput();

    let encryption = await encrypt(
      nonce,
      plaintext,
      peer.publicKey,
      me.publicKey,
      me.privateKey,
      aad
    );

    let publicKeyResult = encryption.slice(0, 32);
    let cipherLength = parseInt(bytes.toHex(encryption.slice(32, 40)), 16);
    let aadLength = parseInt(bytes.toHex(encryption.slice(40, 48)), 16);
    let cipherResult = encryption.slice(48, 48 + cipherLength);
    let aadResult = encryption.slice(
      48 + cipherLength,
      48 + cipherLength + aadLength
    );
    let nonceResult = encryption.slice(48 + cipherLength + aadLength);

    expect(nonceResult).toEqual(nonce);
    expect(publicKeyResult).toEqual(me.publicKey);
    expect(cipherResult.length).toEqual(20);
    expect(aadResult.toString()).toEqual(aad.toString());
  });

  it('Decrypts the encrypted data', async () => {
    let plaintext = new Uint8Array([1, 2, 3, 4]);

    let [nonce, peer, me, aad] = aeadInput();

    let encryption = await encrypt(
      nonce,
      plaintext,
      me.publicKey,
      peer.publicKey,
      peer.privateKey,
      aad
    );

    let decryption = await decrypt(encryption, me.privateKey);

    expect(decryption.nonce).toEqual(nonce);
    expect(decryption.peerPublicKey).toEqual(peer.publicKey);
    expect(decryption.plaintext).toEqual(plaintext);
    expect(decryption.aad.toString()).toEqual(aad.toString());
  });
});

function aeadInput(): [Nonce, KeyPair, KeyPair, Uint8Array] {
  let keyPair = nacl.box.keyPair();
  let me = {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.secretKey
  };

  let peerKeyPair = nacl.box.keyPair();
  let peer = {
    publicKey: peerKeyPair.publicKey,
    privateKey: peerKeyPair.secretKey
  };

  let nonce = nacl.randomBytes(15);

  let aad = bytes.encodeUtf8('some_aad');

  return [nonce, peer, me, aad];
}

type KeyPair = {
  publicKey: PublicKey;
  privateKey: PrivateKey;
};
