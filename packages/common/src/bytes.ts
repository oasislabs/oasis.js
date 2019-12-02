/**
 * Return a Uint8Array of an ethereum hex-encoded key (EthHex)
 * @param   keystring is the EthHex encoding of the value
 * @param   littleEndian is true if the keystring should be interpreted as
 *          little endian. Otherwise, defaults to big endian.
 * @returns the byte incoding of the value
 */
export function parseHex(keystring: string, littleEndian = false): Uint8Array {
  if (keystring.indexOf('0x') === 0) {
    keystring = keystring.substr(2);
  }
  if (keystring.length % 2 === 1) {
    keystring = '0' + keystring;
  }

  let key = keystring.match(/.{2}/g);

  if (key === null) {
    return new Uint8Array();
  }

  if (littleEndian) {
    key = key.reverse();
  }

  return new Uint8Array(key.map(byte => parseInt(byte, 16)));
}

/**
 * Returns an ethereum hex-encoded key of a Uint8Array
 * @param {Uint8Array} keybytes
 * @returns {String} The EthHex encoding
 */
export function toHex(keybytes: Uint8Array): string {
  return keybytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    '0x'
  );
}

/**
 * @returns a Uint8Array representation of number with numBytes.
 * @param   num is the number of which we want a byte representation.
 * @param   numBytes is the number of bytes to have in the resultant array.
 * @param   littleEndian is true iff the resultant byte array is little Endian.
 * @throws  if the resultant array will be longer than numBytes or the given
 *          `num` is less than 0.
 */
export function parseNumber(
  num: number,
  numBytes: number,
  littleEndian = false
): Uint8Array {
  if (num < 0) {
    throw new Error(`${num} must be greater than or equal to 0`);
  }
  let numberHexStr = num.toString(16);
  if (numberHexStr.length > numBytes) {
    throw new Error(
      `cannot parse ${num} into a byte array of length ${numBytes}`
    );
  }

  numberHexStr = '0'.repeat(numBytes * 2 - numberHexStr.length) + numberHexStr;
  return parseHex(numberHexStr, littleEndian);
}

/**
 * @returns a newly allocated Uint8Array of all arrays concatenated together.
 */
export function concat(arrays: Array<Uint8Array>): Uint8Array {
  let size = 0;
  arrays.forEach(a => (size += a.length));

  const concatenated = new Uint8Array(size);

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
  const decoder =
    typeof TextDecoder === 'undefined'
      ? new (require('util').TextDecoder)('utf-8') // Node.
      : new TextDecoder('utf-8'); // Browser.
  return decoder.decode(array);
}

/**
 * encodeUtf8 is a string encoding utility for both node and browsers.
 */
export function encodeUtf8(input: string): Uint8Array {
  const encoder =
    typeof TextEncoder === 'undefined'
      ? new (require('util').TextEncoder)('utf-8') // Node.
      : new TextEncoder(); // Browser.
  return encoder.encode(input);
}

/**
 * Converts the given byte array to a number. Cannot parse a number
 * larger than u64, specifically, 2**53-1 (javascripts max number).
 */
export function toNumber(bytes: Uint8Array, le = false): number {
  if (bytes.length > 8) {
    throw new Error('Cannot parse a number greater than u64');
  }
  let b = toHex(bytes).substr(2);
  if (le) {
    const match = b.match(/../g);
    if (match !== null) {
      b = match.reverse().join('');
    }
  }
  const result = parseInt(b, 16);
  if (result >= Number.MAX_SAFE_INTEGER) {
    throw new Error(`Overflowed when converting to number: ${bytes}`);
  }
  return result;
}

/**
 * @returns the given bytes as a Uint8Array.
 * @throws  if the given bytes is not of the given `length`.
 */
export function assertLength(
  bytes: string | Uint8Array,
  length: number
): Uint8Array {
  if (typeof bytes === 'string') {
    bytes = parseHex(bytes);
  }
  if (bytes.length !== length) {
    throw new InvalidBytesError(
      bytes,
      `invalid bytes length: received ${bytes.length} but expected ${length}`
    );
  }
  return bytes;
}

export class InvalidBytesError extends Error {
  constructor(readonly bytes: Uint8Array, ...params: any[]) {
    super(...params);
  }
}
