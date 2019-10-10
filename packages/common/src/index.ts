export { default as cbor } from './cbor';
import * as bytes from './bytes';
export { Db, LocalStorage, DummyStorage } from './db';
export { sleep } from './utils';

/**
 * A 20-byte Oasis account address. May be hex-encoded.
 */
export type Address = string | Uint8Array;

/**
 * A 16-byte Oasis account balance.
 * JS `Number`s do not have enough precision to hold a 128-bit integer
 * so you should prefer to encode as hex or pass a Uint8Array directly.
 */
export type Balance = string | Uint8Array | number;

export { bytes };
