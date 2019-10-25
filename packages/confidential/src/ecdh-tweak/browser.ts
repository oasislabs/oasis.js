import { PublicKey, PrivateKey } from '..';
import nacl from '../tweetnacl';

let hmacKeySingleton: undefined | Promise<any>;

export async function ecdhTweak(
  peerPublicKey: PublicKey,
  privateKey: PrivateKey
): Promise<Uint8Array> {
  if (typeof hmacKeySingleton === 'undefined') {
    hmacKeySingleton = makeHmacKey();
  }
  const hmacKey = await hmacKeySingleton;
  let preMasterKey = nacl.scalarMult(privateKey.bytes, peerPublicKey.bytes);

  let aesKey = await window.crypto.subtle.sign(
    // @ts-ignore
    { name: 'HMAC' },
    hmacKey,
    preMasterKey
  );

  const owndAesKey = new Uint8Array(aesKey);

  // Attempt to force references to be dropped since tweetnacl retains ownership
  // of the underlying array.
  preMasterKey = undefined;
  aesKey = undefined;

  return owndAesKey;
}

async function makeHmacKey() {
  const boxKDFTweak = new TextEncoder().encode('MRAE_Box_Deoxys-II-256-128');
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
