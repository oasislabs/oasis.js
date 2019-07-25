import { keccak256 } from 'js-sha3';
import Gateway, { RpcOptions, OasisGateway } from '@oasislabs/gateway';
import { cbor, bytes, Db } from '@oasislabs/common';
import {
  DeployHeaderOptions,
  Idl,
  OasisCoder,
  RpcCoder,
  Service,
  deploy,
  fromWasmSync,
  header,
  setGateway
} from '@oasislabs/service';
import { Deoxysii, encrypt, decrypt } from '@oasislabs/confidential';
import {
  Web3Gateway,
  EthereumCoder,
  EthereumWallet as Wallet
} from '@oasislabs/ethereum';

let config = {};
if (typeof process !== 'undefined') {
  const fs = require('fs');
  let nextIsConfig = false;
  let configArgv = '{}';
  for (let i = 0; i < process.argv.length; i++) {
    let arg = process.argv[i];
    if (nextIsConfig) {
      configArgv = arg;
      break;
    }
    if (arg === '-c' || arg === '--config') {
      nextIsConfig = true;
    }
  }
  let configOrPath = JSON.parse(configArgv);
  config =
    typeof configOrPath === 'object'
      ? configOrPath
      : JSON.parse(fs.readFileSync(configOrPath));
}

const oasis = {
  Service,
  deploy,
  Wallet,
  setGateway,
  gateways: {
    Gateway,
    Web3Gateway
  },
  utils: {
    bytes,
    cbor,
    encrypt,
    decrypt,
    OasisCoder,
    EthereumCoder,
    header,
    keccak256
  },
  config,
  service: new Proxy({} as any, {
    get(svcCache, serviceName) {
      const find = require('find');
      const fs = require('fs');

      if (typeof window !== 'undefined') {
        throw '`oasis.project` is not (yet) available in the browser';
      }

      if (svcCache._populated !== true) {
        let projectRoot = svcCache.dir;
        if (projectRoot === undefined) {
          const path = require('path');

          projectRoot = require('process').cwd();
          while (!fs.existsSync(path.join(projectRoot, '.git'))) {
            let parent = path.dirname(projectRoot);
            if (parent == projectRoot) {
              projectRoot = undefined;
            }
            projectRoot = parent;
          }
        }

        if (projectRoot === undefined) {
          throw 'Could not determine project root. Please manually set `oasis.project.dir`';
        }

        find
          .fileSync(/target\/service\/.*\.wasm/, projectRoot)
          .reduce((services, wasmPath) => {
            let bytecode = fs.readFileSync(wasmPath);
            let idl = fromWasmSync(bytecode);
            services[idl.name] = new ServiceDefinition(bytecode, idl);
            return services;
          }, svcCache);

        svcCache._populated = true;
      }

      return svcCache[serviceName];
    }
  })
};

export class ServiceDefinition {
  public idl: Idl;
  public bytecode: Uint8Array;

  constructor(bytecode: Uint8Array, idl: Idl) {
    this.bytecode = bytecode;
    this.idl = idl;
  }

  public async deploy(...args: any[]): Promise<any> {
    let numCtorArgs = this.idl.constructor.inputs.length;
    let options = args[numCtorArgs];
    let deployOpts = Object.assign({}, oasis.config, options, {
      arguments: args.slice(0, numCtorArgs),
      bytecode: this.bytecode,
      idl: this.idl
    });
    return deploy(deployOpts);
  }
}

export type AbbrevDeployOptions = {
  header?: DeployHeaderOptions;
  gateway?: OasisGateway;
  db?: Db;
  coder?: RpcCoder;
  options?: RpcOptions;
};

export default oasis;
