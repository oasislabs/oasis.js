import { Bytes } from '@oasis/types';

/**
 * Return a Uint8Array of an ethereum hex-encoded key (EthHex)
 * @param {String} keystring The EthHex encoding of the value
 * @returns {Uint8Array} The byte incoding of the value
 */
export function parseHex(keystring: string): Uint8Array {
  if (keystring.indexOf('0x') === 0) {
    keystring = keystring.substr(2);
  }
  let key = keystring.match(/.{1,2}/g);

  if (key === null) {
    return new Uint8Array();
  }

  return new Uint8Array(key.map(byte => parseInt(byte, 16)));
}

/**
 * Returns an ethereum hex-encoded key of a Uint8Array
 * @param {Uint8Array} keybytes
 * @returns {String} The EthHex encoding
 */
export function toHex(keybytes: Bytes): string {
  // Already a hex string so return.
  if (typeof keybytes === 'string') {
    if (!keybytes.startsWith('0x')) {
      return '0x' + keybytes;
    }
    return keybytes;
  }
  return keybytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    '0x'
  );
}

/**
 * @returns a Uint8Array representation of number with numBytes.
 * @param   {Number} number is the number of which we want a byte representation.
 * @throws  {Error} if the resultant array will be longer than
 *          numBytes.
 */
export function parseNumber(num: number, numBytes: number): Uint8Array {
  let numberHexStr = num.toString(16);
  if (numberHexStr.length > numBytes) {
    throw Error(`cannot parse ${num} into a byte array of length ${numBytes}`);
  }

  numberHexStr = '0'.repeat(numBytes * 2 - numberHexStr.length) + numberHexStr;
  return parseHex(numberHexStr);
}

/**
 * @returns a newly allocated Uint8Array of all arrays concatenated together.
 */
export function concat(arrays: Array<Uint8Array>): Uint8Array {
  let size = 0;
  arrays.forEach(a => (size += a.length));

  let concatenated = new Uint8Array(size);

  let start = 0;
  arrays.forEach(a => {
    concatenated.set(a, start);
    start += a.length;
  });

  return concatenated;
}

/**
 * decodeUtf8 is a string decoding utility for both node and browsers.
 */
export function decodeUtf8(array: Uint8Array): string {
  let decoder =
    // tslint:disable-next-line
    typeof TextDecoder === 'undefined'
      ? // @ts-ignore
        new (require('util')).TextDecoder('utf-8') // Node.
      : new TextDecoder('utf-8'); // Browser.
  // @ts-ignore
  return decoder.decode(array);
}

/**
 * encodeUtf8 is a string encoding utility for both node and browsers.
 */
export function encodeUtf8(input: string): Uint8Array {
  let encoder =
    // tslint:disable-next-line
    typeof TextEncoder === 'undefined'
      ? // @ts-ignore
        new (require('util')).TextEncoder('utf-8') // Node.
      : new TextEncoder(); // Browser.
  // @ts-ignore
  return encoder.encode(input);
}
