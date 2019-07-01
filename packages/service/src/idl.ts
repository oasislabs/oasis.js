import { bytes } from '@oasis/common';

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

export function fromWasm(bytecode: Uint8Array): Idl {
  // @ts-ignore
  let wasmModule = new WebAssembly.Module(bytecode);
  // @ts-ignore
  let sections = WebAssembly.Module.customSections(
    wasmModule,
    'mantle-interface'
  );
  if (sections.length !== 1) {
    throw new Error('Wasm bytecode must have one mantle-interface section');
  }
  return JSON.parse(bytes.decodeUtf8(sections[0]));
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
