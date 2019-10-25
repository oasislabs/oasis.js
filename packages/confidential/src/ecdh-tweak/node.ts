import { PublicKey, PrivateKey } from '..';
import nacl from '../tweetnacl';

export async function ecdhTweak(
  peerPublicKey: PublicKey,
  privateKey: PrivateKey
): Promise<Uint8Array> {
  const boxKDFTweakStr = 'MRAE_Box_Deoxys-II-256-128';
  const boxKDFTweak = new Uint8Array(boxKDFTweakStr.length);
  for (let i = 0; i < boxKDFTweakStr.length; i++) {
    boxKDFTweak[i] = boxKDFTweakStr.charCodeAt(i);
  }

  const preMasterKey = nacl.scalarMult(privateKey.bytes, peerPublicKey.bytes);
  const hash = require('crypto').createHmac('sha256', boxKDFTweak);
  hash.update(preMasterKey);
  return new Uint8Array(hash.digest());
}
