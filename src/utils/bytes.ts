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
export function toHex(keybytes: Uint8Array): string {
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
