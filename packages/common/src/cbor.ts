/**
 * Cbor utility module to
 * 1) provide a clean import (import * as cbor from './cbor';) and
 * 2) provide a consistent Uint8Array interface, since cbor-js uses ArrayBuffers.
 */

import * as _cborJs from 'cbor-js';

let cborJs: any = undefined;

// Browser.
if (typeof window !== 'undefined') {
  cborJs = _cborJs.default;
}
// Node;
else {
  cborJs = require('cbor-js');
}

export function encode(input: any): Uint8Array {
  return new Uint8Array(cborJs.encode(input));
}

export function decode(input: Uint8Array): any {
  try {
    return cborJs.decode(input.buffer);
  } catch (e) {
    throw new CborDecodeError(
      input,
      `Failed to cbor decode ${input} with error: ${e.message}`
    );
  }
}

const cbor = {
  encode,
  decode,
};

export class CborDecodeError extends Error {
  constructor(private data: Uint8Array, ...params: any[]) {
    super(...params);
  }
}

export default cbor;
