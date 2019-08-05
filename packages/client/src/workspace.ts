import Gateway from '@oasislabs/gateway';
import {
  Idl,
  deploy,
  fromWasmSync,
  setGateway,
  RpcOptions,
  OasisGateway,
  defaultOasisGateway
} from '@oasislabs/service';
import { Web3Gateway, EthereumWallet as Wallet } from '@oasislabs/ethereum';

let _populatedWorkspace = false;

export default new Proxy({} as any, {
  get(
    workspaceCache: { [key: string]: ServiceDefinition },
    serviceName: string
  ) {
    const find = require('find');
    const fs = require('fs');
    const process = require('process');

    // tslint:disable-next-line strict-type-predicates
    if (typeof window !== 'undefined') {
      throw new Error(
        '`oasis.workspace` is not (yet) available in the browser'
      );
    }

    if (!_populatedWorkspace) {
      let projectRoot = process.env.OASIS_WORKSPACE;
      if (projectRoot === undefined) {
        const path = require('path');

        projectRoot = process.cwd();
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
          'Could not find workspace root. Perhaps set the `OASIS_WORKSPACE` env var?'
        );
      }

      find
        .fileSync(/target\/service\/.*\.wasm/, projectRoot)
        .reduce((services, wasmPath) => {
          let bytecode = fs.readFileSync(wasmPath);
          let idl = fromWasmSync(bytecode);
          services[idl.name] = new ServiceDefinition(bytecode, idl);
          return services;
        }, workspaceCache);

      _populatedWorkspace = true;
    }

    return workspaceCache[serviceName];
  }
});

class ServiceDefinition {
  constructor(readonly bytecode: Uint8Array, readonly idl: Idl) {}

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

  private async _getGateway(): Promise<OasisGateway> {
    try {
      return defaultOasisGateway();
    } catch (e) {
      // tslint:disable-next-line strict-type-predicates
      if (typeof window !== 'undefined') {
        throw e;
      }

      let config = await Config.read();
      setGateway(config.gateway());

      return defaultOasisGateway();
    }
  }
}

class Config {
  constructor(private inner) {}

  public static async read(): Promise<Config> {
    const configPath =
      process.env.OASIS_CONFIG_FILE ||
      require('path').join(
        require('env-paths')('oasis', { suffix: '' }).config,
        'config.toml'
      );

    const config = require('toml').parse(
      await require('util').promisify(require('fs').readFile)(configPath)
    );
    if (!('profile' in config)) {
      throw new Error(`No profile in ${configPath}`);
    }
    const profile = process.env.OASIS_PROFILE || 'default';
    if (!(profile in config.profile)) {
      throw new Error(`No profile named \`${profile}\` in ${configPath}`);
    }

    const gatewayConfig = config.profile[profile];

    return new Config(gatewayConfig);
  }

  public gateway(): OasisGateway {
    if (this.inner.mnemonic && this.inner.private_key) {
      throw new Error(
        `Configuration file cannot have both a mnemonic and private key`
      );
    }

    if (this.inner.mnemonic) {
      return new Web3Gateway(
        this.inner.endpoint,
        Wallet.fromMnemonic(this.inner.mnemonic)
      );
    } else if (this.inner.private_key) {
      return new Web3Gateway(
        this.inner.endpoint,
        new Wallet(this.inner.private_key)
      );
    } else {
      return new Gateway(this.inner.endpoint);
    }
  }
}
