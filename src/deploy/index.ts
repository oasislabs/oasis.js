import Service from '../service';
import { Idl } from '../idl';
import { Bytes } from '../types';
import { Provider, defaultProvider } from '../provider';
import { DeployHeader, DeployHeaderOptions } from './header';
import { PlaintextRpcEncoder } from '../encoder';
import * as bytes from '../utils/bytes';

/**
 * deploy creates a service on the Oasis cloud.
 *
 * @returns a Service object to make rpc requests with.
 */
export default async function deploy(options: DeployOptions): Promise<Service> {
  sanitizeOptions(options);

  let data = await deploycode(options);
  let request = { data, method: 'oasis_deploy' };

  let prov = provider(options);

  let address = await prov.send(request);

  return new Service(options.idl, address);
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
 * @returns the provider to use for deploying the Service.
 */
function provider(options: DeployOptions): Provider {
  return options.provider || defaultProvider();
}

/**
 * DeployOptions specify the arguments for deploying a Service.
 */
type DeployOptions = {
  idl: Idl;
  bytecode: Bytes;
  arguments?: Array<any>;
  header?: DeployHeaderOptions;
  provider?: Provider;
};
