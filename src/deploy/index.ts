import Service from '../service';
import { Idl } from '../idl';
import { Bytes } from '../types';
import { OasisGateway, defaultOasisGateway } from '../oasis-gateway';
import { DeployHeader, DeployHeaderOptions } from './header';
import { PlaintextRpcEncoder } from '../coder/encoder';
import * as bytes from '../utils/bytes';

/**
 * deploy creates a service on the Oasis cloud.
 *
 * @returns a Service object to make rpc requests with.
 */
export default async function deploy(options: DeployOptions): Promise<Service> {
  sanitizeOptions(options);

  let data = await deploycode(options);
  let request = { data };

  let gateway = oasisGateway(options);

  let response = await gateway.rpc(request);

  if (!response.address) {
    throw new Error(`Invalid gateway response: ${response}`);
  }

  return new Service(options.idl, response.address, {
    gateway
  });
}

/**
 * Fills in any left out deploy options and converts to the required
 * types if necessary.
 */
function sanitizeOptions(options: DeployOptions) {
  if (typeof options.bytecode === 'string') {
    options.bytecode = bytes.parseHex(options.bytecode.substr(2));
  }
  options.header = deployHeader(options);
}

/**
 * @returns the deploy header options from the given DeployOptions,
 *          filling in any left out options with the default header.
 */
function deployHeader(options: DeployOptions): DeployHeaderOptions {
  let defaultHeader = { confidential: true };
  return Object.assign(defaultHeader, options.header);
}

/**
 * @returns the deploycode from the given options, i.e.,
 *          OASIS_HEADER || INITCODE.
 */
async function deploycode(options: DeployOptions): Promise<Bytes> {
  let code = await initcode(options);
  let header = deployHeader(options);
  return DeployHeader.deployCode(header, code);
}

/**
 * @returns the initcode, i.e., BYTECODE || ABI_ENCODED(args).
 */
async function initcode(options: DeployOptions): Promise<Bytes> {
  let encoder = new PlaintextRpcEncoder();
  let constructorArgs = options.idl.constructor.inputs;
  let args = await encoder.encode(
    { name: 'constructor', inputs: constructorArgs },
    options.arguments || []
  );
  let bytecode = options.bytecode as Uint8Array;
  return bytes.concat([bytecode, args]);
}

/**
 * @returns the gateway to use for deploying the Service.
 */
function oasisGateway(options: DeployOptions): OasisGateway {
  return options.gateway || defaultOasisGateway();
}

/**
 * DeployOptions specify the arguments for deploying a Service.
 */
type DeployOptions = {
  idl: Idl;
  bytecode: Bytes;
  arguments?: Array<any>;
  header?: DeployHeaderOptions;
  gateway?: OasisGateway;
};
