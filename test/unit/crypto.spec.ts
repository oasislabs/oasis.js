import { encrypt, decrypt } from '../../src/confidential';
import { Nonce, PublicKey, PrivateKey } from '../../src/types';
const nacl = require('tweetnacl');

describe('Crypto', () => {
  it('Encrypts to the wire format', async () => {
    let plaintext = new Uint8Array([1, 2, 3, 4]);

    let [nonce, peer, me] = aeadInput();

    let encryption = await encrypt(
      nonce,
      plaintext,
      peer.publicKey,
      me.publicKey,
      me.privateKey
    );

    let nonceResult = encryption.slice(0, 15);
    let publicKeyResult = encryption.slice(15, 15 + 32);
    let cipherResult = encryption.slice(15 + 32);

    expect(nonceResult).toEqual(nonce);
    expect(publicKeyResult).toEqual(me.publicKey);
    expect(cipherResult.length).toEqual(20);
  });

  it('Decrypts the encrypted data', async () => {
    let plaintext = new Uint8Array([1, 2, 3, 4]);

    let [nonce, peer, me] = aeadInput();

    let encryption = await encrypt(
      nonce,
      plaintext,
      me.publicKey,
      peer.publicKey,
      peer.privateKey
    );

    let decryption = await decrypt(encryption, me.privateKey);

    expect(decryption.nonce).toEqual(nonce);
    expect(decryption.peerPublicKey).toEqual(peer.publicKey);
    expect(decryption.plaintext).toEqual(plaintext);
  });
});

function aeadInput(): [Nonce, KeyPair, KeyPair] {
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

  return [nonce, peer, me];
}

type KeyPair = {
  publicKey: PublicKey;
  privateKey: PrivateKey;
};
