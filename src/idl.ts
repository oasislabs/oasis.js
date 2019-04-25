// TODO. Define all these types for input validation.

export interface Idl {
  [key: string]: any;
}
/*
export interface Idl {
	name: RpcIdent,
	namespace: RpcIdent,
	constructor: RpcConstructor,
	functions: Array<RpcFn>,
	idl_gen_version: string,
	imports?: Array<RpcImport>,
	type_defs?: Array<RpcTypeDef>,
}
*/
type RpcIdent = string;

type RpcImport = {
  name: RpcIdent;
  version: string;
};

type RpcTypeDef = {
  type: string; // Struct or Enum
  name: RpcIdent;
  fields?: Array<RpcField>;
  variants?: Array<RpcIdent>;
};

type RpcField = {
  name: RpcIdent;
  type: RpcType;
};

enum RpcType {
  Struct = 'struct',
  Tuple = 'tuple',
  String = 'string'
}

type RpcConstructor = {};

export type RpcFn = {
  name: string;
  inputs: Array<RpcInput>; // todo
};

export type RpcInput = any;
