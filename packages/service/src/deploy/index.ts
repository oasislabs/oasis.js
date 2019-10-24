import { Address, Db, bytes } from '@oasislabs/common';

import { Service } from '../service';
import { Idl, fromWasm } from '../idl';
import {
  OasisGateway,
  RpcOptions,
  defaultOasisGateway,
} from '../oasis-gateway';
import { DeployHeader, DeployHeaderOptions } from './header';
import { OasisCoder } from '../coder/oasis';
import { RpcCoder } from '../coder';
import { DeployError } from '../error';

/**
 * deploy creates a service on the Oasis cloud.
 *
 * Expects args to be of the form: [arg1, arg2, ..., argN, options],
 * where argI is a positional constructor argument for the service and
 * the options represents the deploy options.
 *
 * `arg1`, `arg2`, ..., `argnN`: Service specific constructor args.
 * `options`: `_DeployOptions`.
 *
 * // Type just for documentation. Should change in line with the `DeployOptions`.
 * type _DeployOptions = {
 *  bytecode: Uint8Array | string;
 *  idl?: Idl;
 *  header?: DeployHeaderOptions;
 *  gateway?: OasisGateway;
 *  db?: Db;
 *  coder?: RpcCoder;
 *  gasLimit?: string | number;
 *  gasPrice?: string | number;
 *  value?: string | number;
 * };
 *
 * @returns a Service object to make rpc requests with.
 */
export default async function deploy(...args: any[]): Promise<Service> {
  // Convert from the unstructured api arguments to the typed DeployOptions.
  const options = await extractOptions(args);

  const data = await deployCode(options);

  const gateway = oasisGateway(options);

  const response = await gateway.deploy({ data, options: options.options });

  if (!response.address) {
    throw new DeployError(args, `Invalid gateway response: ${response}`);
  }
  return new Service(options.idl!, new Address(response.address), {
    gateway,
    db: options.db,
    coder: options.coder,
  });
}

/**
 * Transforms the given unstructured array of arguments into a
 * DeployOptions type, throwing an error if the arguments are
 * malformed in any way.
 */
async function extractOptions(args: any[]): Promise<DeployOptions> {
  if (args.length === 0) {
    throw new DeployError(args, 'No deploy arguments provided');
  }

  // Extract the rpc-options from the given args.
  const options = (() => {
    // Options should be the last argument in the args array.
    const opts: any = args.pop();
    // Assert required options are given.
    if (!opts.bytecode) {
      throw new DeployError([...args, opts], 'No bytecode provided');
    }
    // Convert hex-string convenience api into Uint8Array
    if (typeof opts.bytecode === 'string') {
      opts.bytecode = bytes.parseHex(opts.bytecode);
    }
    return opts;
  })();

  // The given arguments are safe (ignoring the service-specific constructor args,
  // which will be rejected by the runtime if the arguments given are invalid),
  // so convert from `any` into the `DeployOptions` type.
  //
  // TODO: would be nice if the client used the IDL to validate the inputs so that
  //       we dont' have to rely on the runtime to throw an error.
  //       See https://github.com/oasislabs/oasis.js/issues/14.
  const deployOptions = await toDeployOptions(args, options);

  validateDeployOptions(deployOptions, args);

  return deployOptions;
}

/**
 * Fills in any left out deploy options and converts to the required
 * types if necessary.
 */
async function toDeployOptions(
  args: any[],
  options: any
): Promise<DeployOptions> {
  const idl = options.idl || (await fromWasm(options.bytecode));
  const rpcOptions = (() => {
    return {
      gasLimit: options.gasLimit,
      gasPrice: options.gasPrice,
      value: options.value,
    };
  })();

  return {
    bytecode: options.bytecode,
    idl,
    header: deployHeader(options),
    arguments: args,
    options: rpcOptions,
    gateway: options.gateway,
    db: options.db,
    coder: options.coder,
  };
}

/**
 * @returns the deploy header options from the given DeployOptions,
 *          filling in any left out options with the default header.
 */
function deployHeader(options: DeployOptions): DeployHeaderOptions {
  const defaultHeader = { confidential: true };
  return Object.assign(defaultHeader, options.header);
}

/**
 * @returns the deployCode from the given options, i.e.,
 *          OASIS_HEADER || INITCODE.
 */
async function deployCode(options: DeployOptions): Promise<Uint8Array> {
  const code = await initcode(options);
  const header = deployHeader(options);
  return DeployHeader.deployCode(header, code);
}

/**
 * @returns the initcode, i.e., BYTECODE || ABI_ENCODED(args).
 */
async function initcode(options: DeployOptions): Promise<Uint8Array> {
  const encoder = options.coder ? options.coder : OasisCoder.plaintext();
  return encoder.initcode(
    options.idl!,
    options.arguments || [],
    options.bytecode
  );
}

/**
 * @returns the gateway to use for deploying the Service.
 */
function oasisGateway(options: DeployOptions): OasisGateway {
  return options.gateway || defaultOasisGateway();
}

/**
 * @throws if the given deployOptions are malformed.
 */
function validateDeployOptions(deployOptions: DeployOptions, args: any[]) {
  if (
    deployOptions.header!.confidential &&
    (!deployOptions.options || !deployOptions.options.gasLimit)
  ) {
    throw new DeployError(
      args,
      'gasLimit must be provided for confidential deploys'
    );
  }
}

/**
 * DeployOptions specify the arguments for deploying a Service.
 */
type DeployOptions = {
  bytecode: Uint8Array;
  idl?: Idl;
  arguments?: any[];
  header?: DeployHeaderOptions;
  gateway?: OasisGateway;
  db?: Db;
  coder?: RpcCoder;
  options?: RpcOptions;
};
