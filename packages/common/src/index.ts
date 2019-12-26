export { default as cbor } from './cbor';
import * as bytes from './bytes';
export { Db, LocalStorage, DummyStorage } from './db';
export { sleep } from './utils';

/**
 * Lighteweight wrapper for bytes with an easy hex conversion.
 */
export abstract class Bytes {
  private _bytes: Uint8Array;
  private _hex: string | undefined;

  // This takes `expectedLength` because Typescript doesn't have `abstract static`.
  constructor(expectedLength: number, repr: string | Uint8Array) {
    if (typeof repr === 'string') {
      this._bytes = bytes.parseHex(repr);
    } else {
      this._bytes = repr;
    }
    if (this._bytes.length !== expectedLength) {
      throw new Error(
        `invalid length: expected ${expectedLength} bytes, got ${this._bytes.length} bytes`
      );
    }
  }

  get bytes(): Uint8Array {
    return this._bytes;
  }

  get hex(): string {
    if (typeof this._hex === 'undefined') {
      this._hex = bytes.toHex(this._bytes!);
    }
    return this._hex;
  }
}

/**
 * A 20-byte Oasis account address. May be hex-encoded.
 */
export class Address extends Bytes {
  constructor(repr: string | Uint8Array) {
    super(20, repr);
  }
}

/**
 * A 16-byte Oasis account balance.
 * JS `Number`s do not have enough precision to hold a 128-bit integer
 * so you should prefer to encode as hex or pass a Uint8Array directly.
 */
export class Balance extends Bytes {
  constructor(repr: string | Uint8Array | bigint | number) {
    let balanceBytes = new Uint8Array(16); // 128 bit
    if (typeof repr === 'number') {
      repr = BigInt(repr);
    }
    if (typeof repr === 'bigint') {
      for (let i = 0; i < balanceBytes.length; i++) {
        balanceBytes[balanceBytes.length - i - 1] = Number(
          (repr >> BigInt(i * 8)) & BigInt(0xff)
        );
      }
    } else if (typeof repr === 'string') {
      const parsed = bytes.parseHex(repr);
      balanceBytes.set(parsed, balanceBytes.length - parsed.length);
    } else {
      balanceBytes = repr;
    }
    super(16, balanceBytes);
  }
}

export { bytes };
