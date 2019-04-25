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
}

type RpcIdent = string;

type RpcImport = {};

type RpcTypeDef = {};

type RpcField = {};

enum RpcType {}

type RpcConstructor = {};

export type RpcFn = {
  name: string;
  inputs: Array<RpcInput>;
};

export type RpcInput = any;
