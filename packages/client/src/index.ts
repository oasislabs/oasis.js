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
  setGateway,
  defaultOasisGateway
} from '@oasislabs/service';
import { Deoxysii, encrypt, decrypt } from '@oasislabs/confidential';
import {
  Web3Gateway,
  EthereumCoder,
  EthereumWallet as Wallet
} from '@oasislabs/ethereum';

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
  service: new Proxy({} as any, {
    get(svcCache, serviceName) {
      const find = require('find');
      const fs = require('fs');

      /* tslint:disable */
      if (typeof window !== 'undefined') {
        throw new Error(
          '`oasis.project` is not (yet) available in the browser'
        );
      }
      /* tslint:enable */

      if (svcCache._populated !== true) {
        let projectRoot = svcCache.dir;
        if (projectRoot === undefined) {
          const path = require('path');

          projectRoot = require('process').cwd();
          while (!fs.existsSync(path.join(projectRoot, '.git'))) {
            let parent = path.dirname(projectRoot);
            if (parent === projectRoot) {
              projectRoot = undefined;
            }
            projectRoot = parent;
          }
        }

        if (projectRoot === undefined) {
          throw new Error(
            'Could not determine project root. Please manually set `oasis.service.dir`'
          );
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
  }),
  disconnect() {
    try {
      defaultOasisGateway().disconnect();
    } catch (_e) {
      // tslint:disable-line no-empty
    }
  }
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
    let deployOpts = Object.assign({}, options, {
      arguments: args.slice(0, numCtorArgs),
      bytecode: this.bytecode,
      idl: this.idl,
      gateway: await this._getGateway()
    });
    return deploy(deployOpts);
  }

  async _getGateway(): Promise<OasisGateway> {
    let gateway;
    try {
      return defaultOasisGateway();
    } catch (e) {
      /* tslint:disable */
      if (typeof window !== 'undefined') {
        throw e;
      }
      /* tslint:enable */
      const configPath =
        process.env.OASIS_CONFIG_FILE ||
        require('path').join(
          require('env-paths')('oasis', { suffix: '' }).config,
          'config.toml'
        );
      const config = require('toml').parse(
        await require('util').promisify(require('fs').readFile)(configPath)
      );
      const profile = process.env.OASIS_PROFILE || 'default';
      if (!(profile in config.profiles)) {
        throw new Error(`No profile named \`${profile}\` in ${configPath}`);
      }
      const gatewayConfig = config.profiles[profile];
      setGateway(
        gatewayConfig.mnemonic
          ? new Web3Gateway(
              gatewayConfig.endpoint,
              Wallet.fromMnemonic(gatewayConfig.mnemonic)
            )
          : new Gateway(gatewayConfig.endpoint)
      );

      return defaultOasisGateway();
    }
  }
}

export default oasis;
