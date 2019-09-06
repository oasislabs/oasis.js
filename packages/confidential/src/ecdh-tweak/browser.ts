import * as deoxysii from 'deoxysii';
import { Nonce, PublicKey, PrivateKey } from '..';
import nacl from '../tweetnacl';

let hmacKey: any = undefined;

export async function ecdhTweak(
  peerPublicKey: PublicKey,
  privateKey: PrivateKey
): Promise<Uint8Array> {
  if (!hmacKey) {
    hmacKey = await makeHmacKey();
  }
  let preMasterKey = nacl.scalarMult(privateKey.bytes(), peerPublicKey.bytes());

  // tslint:disable-next-line
  let aesKey = await window.crypto.subtle.sign(
    // @ts-ignore
    { name: 'HMAC' },
    hmacKey,
    preMasterKey
  );

  let owndAesKey = new Uint8Array(aesKey);

  // Attempt to force references to be dropped since tweetnacl retains ownership
  // of the underlying array.
  // @ts-ignore
  preMasterKey = undefined;
  aesKey = undefined;

  return owndAesKey;
}

async function makeHmacKey() {
  const boxKDFTweak = new TextEncoder().encode('MRAE_Box_Deoxys-II-256-128');
  // @ts-ignore
  return window.crypto.subtle.importKey(
    'raw',
    boxKDFTweak,
    {
      name: 'HMAC',
      hash: { name: 'SHA-256' },
    },
    false,
    ['sign']
  );
}
