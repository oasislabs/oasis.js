declare module 'cbor-js' {
  export function encode(input: any): Uint8Array;
  export function decode(input: Uint8Array): any;
}
