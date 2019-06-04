import { encrypt, decrypt } from '../../src/confidential';
import { Nonce, PublicKey, PrivateKey } from '../../src/types';
import * as bytes from '../../src/utils/bytes';
const nacl = require('tweetnacl');

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
    let aadResult = bytes.decodeUtf8(
      encryption.slice(48 + cipherLength, 48 + cipherLength + aadLength)
    );
    let nonceResult = encryption.slice(48 + cipherLength + aadLength);

    expect(nonceResult).toEqual(nonce);
    expect(publicKeyResult).toEqual(me.publicKey);
    expect(cipherResult.length).toEqual(20);
    expect(aadResult).toEqual(aad);
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
    expect(decryption.aad).toEqual(aad);
  });
});

function aeadInput(): [Nonce, KeyPair, KeyPair, string] {
  let aad = 'some_aad';
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

  return [nonce, peer, me, aad];
}

type KeyPair = {
  publicKey: PublicKey;
  privateKey: PrivateKey;
};
