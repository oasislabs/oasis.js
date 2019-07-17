import { bytes } from '@oasislabs/common';
import { inflateRaw } from 'pako';

// Idl type definitions.
//
// TODO. https://github.com/oasislabs/oasis-client/issues/13

// Idl {
//   name: RpcIdent,
//   namespace: RpcIdent,
//   constructor: RpcConstructor,
//   functions: Array<RpcFn>,
//   idl_gen_version: string,
//   imports?: Array<RpcImport>,
//   type_defs?: Array<RpcTypeDef>,
// }
export interface Idl {
  [key: string]: any;
  constructor: RpcConstructor;
}

export async function fromWasm(bytecode: Uint8Array): Promise<Idl> {
  // @ts-ignore
  let wasmModule = await WebAssembly.compile(bytecode);
  // @ts-ignore
  let sections = WebAssembly.Module.customSections(
    wasmModule,
    'oasis-interface'
  );

  if (sections.length !== 1) {
    throw new Error('Wasm bytecode must have one mantle-interface section');
  }

  let deflatedIdl = new Uint8Array(sections[0]);
  let inflatedIdl = new Uint8Array(inflateRaw(deflatedIdl));

  return JSON.parse(bytes.decodeUtf8(inflatedIdl));
}

type RpcIdent = string;

type RpcImport = {};

type RpcTypeDef = {};

type RpcField = {};

enum RpcType {}

type RpcConstructor = any;

export type RpcFn = {
  name: string;
  inputs: Array<RpcInput>;
};

export type RpcInput = any;
