import Service from '../service';
import { Idl } from '../idl';
import { Bytes } from '../types';
import { OasisGateway, defaultOasisGateway } from '../oasis-gateway';
import { DeployHeader, DeployHeaderOptions } from './header';
import { OasisCoder } from '../coder/oasis';
import * as bytes from '../utils/bytes';
import { Db } from '../db';
import { RpcCoder } from '../coder';

/**
 * deploy creates a service on the Oasis cloud.
 *
 * @returns a Service object to make rpc requests with.
 */
export default async function deploy(options: DeployOptions): Promise<Service> {
  sanitizeOptions(options);

  let data = await deploycode(options);

  let gateway = oasisGateway(options);

  let response = await gateway.deploy({ data });

  if (!response.address) {
    throw new Error(`Invalid gateway response: ${response}`);
  }
  return new Service(options.idl, response.address, {
    gateway,
    db: options.db,
    coder: options.coder
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
  let encoder = options.coder ? options.coder : OasisCoder.plaintext();
  return encoder.initcode(
    options.idl,
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
 * DeployOptions specify the arguments for deploying a Service.
 */
type DeployOptions = {
  idl: Idl;
  bytecode: Bytes;
  arguments?: Array<any>;
  header?: DeployHeaderOptions;
  gateway?: OasisGateway;
  db?: Db;
  coder?: RpcCoder;
};
