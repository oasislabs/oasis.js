/**
 * Borsh utility module to provide a clean import (import * as borsh from './borsh';)
 */

const borsh = require('borsh');

class Wrapper {
  constructor(val) {
    this.val = val;
  }
}

function getSchema(value) {
  var f = [];
  switch (typeof value) {
    // TODO floats?
    case 'number':
      f.push(['val', 'U64']);
    case 'string':
      f.push(['val', 'String']);
    case 'boolean':
      f.push(['val', 'U8']);
      if (value === true) value = 0xf5;
      else value = 0xf4;
    default:
      if (value === null) {
        f.push(['val', 'U8']);
        value = 0xf6;
      } else if (value === undefined) {
        f.push(['val', 'U8']);
        value = 0xf7;
      } else if (Array.isArray(value)) {
      } else if (value instanceof Uint8Array) {
      } else {
      }
  }
  return [value, new Map([Wrapper, { kind: 'struct', fields: f }])];
}

export function encode(input: any): Uint8Array {
  let value = new Wrapper(input);
  let [new_value, schema] = getSchema(input);
  return borsh.serialize(schema, new_value);
}

export function decode(input: Uint8Array): any {
  let [new_value, schema] = getSchema(input);
  // TODO convert new_value to original form (eg 0xf7 to undefined)
  try {
    return borsh.deserialize(schema, Wrapper, input.buffer);
  } catch (e) {
    throw new BorshDecodeError(
      input,
      `Failed to borsh deserialize ${input} with error: ${e.message}`
    );
  }
}

const borsh = {
  encode,
  decode,
};

export class BorshDecodeError extends Error {
  constructor(private data: Uint8Array, ...params: any[]) {
    super(...params);
  }
}

export default borsh;
