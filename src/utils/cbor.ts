/**
 * Cbor utility module to
 * 1) provide a clean import (import * as cbor from './cbor';) and
 * 2) provide a consistent Uint8Array interface, since cbor-js uses ArrayBuffers.
 */

import * as _cborJs from 'cbor-js';
// Node.
let cborJs = _cborJs;
// Browser.
/* tslint:disable */
if (typeof window !== 'undefined') {
  cborJs = _cborJs.default;
}

export function encode(input: any): Uint8Array {
  return new Uint8Array(cborJs.encode(input));
}

export function decode(input: Uint8Array): any {
  return cborJs.decode(input.buffer);
}

const cbor = {
  encode,
  decode
};

export default cbor;
