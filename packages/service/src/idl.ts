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

export class IdlError extends Error {}

export async function fromWasm(bytecode: Uint8Array): Promise<Idl> {
  return extractIdl(await WebAssembly.compile(bytecode));
}

export function fromWasmSync(bytecode: Uint8Array): Idl {
  return extractIdl(new WebAssembly.Module(bytecode));
}

function extractIdl(wasmModule: WebAssembly.Module): Idl {
  // @ts-ignore
  const sections = WebAssembly.Module.customSections(
    wasmModule,
    'oasis-interface'
  );

  if (sections.length !== 1) {
    throw new IdlError('wasm bytecode must have one oasis-interface section');
  }

  const deflatedIdl = new Uint8Array(sections[0]);
  const inflatedIdl = new Uint8Array(inflateRaw(deflatedIdl));

  return JSON.parse(bytes.decodeUtf8(inflatedIdl));
}

type RpcIdent = string;

type RpcImport = {};

type RpcTypeDef = {};

type RpcField = {};

type RpcConstructor = any;

export type RpcFn = {
  name: string;
  inputs: Array<RpcInput>;
};

export type RpcInput = any;
