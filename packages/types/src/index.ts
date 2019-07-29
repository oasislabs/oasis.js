// `string` should only be valid as a hex string on *input* to a function
// as a convenience api. All types will internally be handled as Buffers.
// All functions will return buffers.
export type Address = string | Uint8Array;
export type H256 = string | Uint8Array;
export type Bytes4 = Uint8Array;
export type Bytes = string | Uint8Array;
