/* eslint-disable @typescript-eslint/camelcase */
import { sha512_256 } from 'js-sha512';

import { PublicKey, PrivateKey } from '.';
import nacl from './tweetnacl';

/**
 * ecdhTweak applies the X25519 scalar multiply with the given public and
 * private keys, and applies a HMAC based tweak to the resulting output.
 */
export async function ecdhTweak(
  peerPublicKey: PublicKey,
  privateKey: PrivateKey
): Promise<Uint8Array> {
  const preMasterKey = nacl.scalarMult(privateKey.bytes, peerPublicKey.bytes);
  const hash = sha512_256.hmac.create('MRAE_Box_Deoxys-II-256-128');
  hash.update(preMasterKey);
  return new Uint8Array(hash.arrayBuffer());
}
