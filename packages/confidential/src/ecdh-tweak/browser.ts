import { PublicKey, PrivateKey, nacl } from '@oasis/types';
import * as deoxysii from 'deoxysii';

let hmacKey: any = undefined;

export async function ecdhTweak(
  peerPublicKey: PublicKey,
  privateKey: PrivateKey
): Promise<Uint8Array> {
  if (!hmacKey) {
    hmacKey = await makeHmacKey();
  }
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

async function makeHmacKey() {
  const boxKDFTweak = new TextEncoder().encode('MRAE_Box_Deoxys-II-256-12');
  // @ts-ignore
  return window.crypto.subtle.importKey(
    'raw',
    boxKDFTweak,
    {
      name: 'HMAC',
      hash: { name: 'SHA-256' }
    },
    false,
    ['sign']
  );
}
