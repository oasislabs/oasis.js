import { PublicKey, PrivateKey } from '../../types';
import * as deoxysii from 'deoxysii';
import nacl from 'tweetnacl';

let boxKDFTweak = undefined;
let hmacKey = undefined;
// tslint:disable-next-line
if (typeof window !== 'undefined') {
  const boxKDFTweak = new TextEncoder().encode('MRAE_Box_Deoxys-II-256-12');
  // @ts-ignore
  window.crypto.subtle
    .importKey(
      'raw',
      boxKDFTweak,
      {
        name: 'HMAC',
        hash: { name: 'SHA-256' }
      },
      false,
      ['sign']
    )
    .then(key => {
      // @ts-ignore
      hmacKey = key;
    });
}

export async function ecdhTweak(
  peerPublicKey: PublicKey,
  privateKey: PrivateKey
): Promise<Uint8Array> {
  let preMasterKey = nacl.scalarMult(privateKey, peerPublicKey);

  // tslint:disable-next-line
  let aesKey = await window.crypto.subtle.sign(
    // @ts-ignore
    { name: 'HMAC' },
    hmacKey,
    preMasterKey
  );
  // @ts-ignore
  preMasterKey = undefined;

  return new Uint8Array(aesKey);
}
