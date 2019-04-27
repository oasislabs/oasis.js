import { PublicKey, PrivateKey } from '../../types';
import * as crypto from 'crypto';
import * as nacl from 'tweetnacl';

export async function ecdhTweak(
  peerPublicKey: PublicKey,
  privateKey: PrivateKey
): Promise<Uint8Array> {
  const boxKDFTweakStr = 'MRAE_Box_Deoxys-II-256-128';
  let boxKDFTweak = new Uint8Array(boxKDFTweakStr.length);
  for (let i = 0; i < boxKDFTweakStr.length; i++) {
    boxKDFTweak[i] = boxKDFTweakStr.charCodeAt(i);
  }

  let preMasterKey = nacl.scalarMult(privateKey, peerPublicKey);
  let hash = crypto.createHmac('sha256', boxKDFTweak);
  hash.update(preMasterKey);
  return new Uint8Array(hash.digest());
}
