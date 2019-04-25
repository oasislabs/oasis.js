// TODO: enforce length on the Buffers.

// `string` should only be valid as a hex string on *input* to a function
// as a convenience api. All types will internally be handled as Buffers.
// All functions will return buffers.
export type Address = string | Buffer;
export type H256 = string | Buffer;
export type Bytes4 = string | Buffer;
export type Bytes = string | Buffer;
