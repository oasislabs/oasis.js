import { Web3Gateway } from '@oasislabs/web3';
import Gateway from '@oasislabs/gateway';
import {
  Idl,
  deploy,
  fromWasmSync,
  setGateway,
  OasisGateway,
  defaultOasisGateway,
} from '@oasislabs/service';
import Wallet from './wallet';

class WorkspaceError extends Error {}

let _populatedWorkspace = false;

export default new Proxy(
  {
    gateway: configGateway,
  } as any,
  {
    get(
      workspaceCache: { [key: string]: ServiceDefinition },
      serviceName: string
    ) {
      const find = require('find');
      const fs = require('fs');
      const process = require('process');

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
            const parentDir = path.dirname(projectRoot);
            if (parentDir === projectRoot) {
              projectRoot = undefined;
            }
            projectRoot = parentDir;
          }
        }

        if (projectRoot === undefined) {
          throw new Error(
            'Could not find workspace root. Perhaps set the `OASIS_WORKSPACE` env var?'
          );
        }

        find
          .fileSync(/target\/service\/.*\.wasm/, projectRoot)
          .reduce((services: any, wasmPath: string) => {
            try {
              const bytecode = fs.readFileSync(wasmPath);
              const idl = fromWasmSync(bytecode);
              services[idl.name] = new ServiceDefinition(bytecode, idl);
            } catch {
              // ignore invalid service
            }
            return services;
          }, workspaceCache);

        _populatedWorkspace = true;
      }

      return workspaceCache[serviceName];
    },
  }
);

export class ServiceDefinition {
  constructor(readonly bytecode: Uint8Array, readonly idl: Idl) {}

  public async deploy(...args: any[]): Promise<any> {
    // Lazily configure the gateway if needed.
    try {
      defaultOasisGateway();
    } catch (e) {
      await configGateway();
    }

    // Place the bytecode into the DeployOptions.
    this.injectBytecode(args);

    // Finally, perform the deploy.
    return deploy(...args);
  }

  /**
   * Inject the bytecode into the deploy options.
   * Deploy options were either provided or not.
   */
  private injectBytecode(args: any[]): void {
    // Deploy options provided, so inject the bytecode into them.
    if (this.idl.constructor.inputs.length + 1 === args.length) {
      // Replace the args' options with a cloned version.
      const options = (() => {
        let o = args.pop();

        if (typeof o !== 'object') {
          throw new WorkspaceError('Options argument must be an object');
        }
        if (o.bytecode) {
          throw new WorkspaceError(
            'Bytecode should not be provided when deploying a workspace service'
          );
        }

        o = JSON.parse(JSON.stringify(o));
        args.push(o);
        return o;
      })();

      // Inject the bytecode into the options.
      options.bytecode = this.bytecode;
    }
    // Deploy options not provided, so create them and then add them
    // to the arguments.
    else if (this.idl.constructor.inputs.length === args.length) {
      const options = {
        bytecode: this.bytecode,
      };
      args.push(options);
    } else {
      throw new WorkspaceError(
        'The first arguments of the deploy command must be ' +
          "the service's constructor arguments"
      );
    }
  }
}

async function configGateway(): Promise<OasisGateway> {
  if (typeof window !== 'undefined') {
    throw new WorkspaceError('Cannot use oasis.workspace in the browser');
  }

  const config = await Config.read();
  setGateway(config.gateway());

  return defaultOasisGateway();
}

class Config {
  constructor(private inner: any) {}

  public static async read(): Promise<Config> {
    const path = require('path');
    const configPath =
      process.env.OASIS_CONFIG_FILE ||
      path.join(
        process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, '.config'),
        'oasis',
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
    let gatewayUrl;
    let gatewayType;
    const credential = new Credential(this.inner.credential);
    if (typeof this.inner.gateway === 'object') {
      gatewayUrl = this.inner.gateway.url;
      gatewayType = getGatewayType(this.inner.gateway.type);
    } else {
      gatewayUrl = this.inner.gateway;
    }
    if (!gatewayType) {
      gatewayType = inferGatewayType(gatewayUrl, credential);
    }

    if (gatewayType === GatewayType.Web3) {
      return new Web3Gateway(gatewayUrl, credential.wallet);
    }
    return new Gateway(gatewayUrl, credential.credential, {
      headers: new Map(),
    });
  }
}

function getGatewayType(gateway: string): GatewayType {
  if (gateway === 'web3') {
    return GatewayType.Web3;
  } else if (gateway === 'oasis') {
    return GatewayType.Oasis;
  }
  throw new Error(
    `Invalid gateway type: \`${gateway}\`.${''} Available options are \`web3\` and \`oasis\``
  );
}

function inferGatewayType(
  gatewayUrl: string,
  credential: Credential
): GatewayType {
  const url = require('url').parse(gatewayUrl.toLowerCase());
  const port = parseInt(url.port, 10);
  if (
    url.hostname.match(/web3/gi) ||
    port in [8545, 8546] ||
    credential.type === CredentialType.Mnemonic ||
    credential.type === CredentialType.PrivateKey
  ) {
    return GatewayType.Web3;
  }
  return GatewayType.Oasis;
}

enum GatewayType {
  Web3,
  Oasis,
}

class Credential {
  public type: CredentialType;

  /** The Ethereum wallet associated with this credential */
  public wallet?: any;

  constructor(public credential: string) {
    const API_TOKEN_NUM_BYTES = 32 + 32 / 8;
    const PRIVATE_KEY_NUM_BYTES = 32;
    const MNEMONIC_NUM_WORDS = 12;
    if (Buffer.from(credential, 'base64').length === API_TOKEN_NUM_BYTES) {
      this.type = CredentialType.ApiToken;
    } else if (
      Buffer.from(credential, 'hex').length === PRIVATE_KEY_NUM_BYTES
    ) {
      this.type = CredentialType.PrivateKey;
      this.wallet = new Wallet(credential);
    } else if (credential.split(' ').length === MNEMONIC_NUM_WORDS) {
      this.type = CredentialType.Mnemonic;
      this.wallet = Wallet.fromMnemonic(credential);
    } else {
      throw new Error(`Invalid credential: \`${credential}\`.`);
    }
  }
}

enum CredentialType {
  PrivateKey,
  Mnemonic,
  ApiToken, // API token is used use with Oasis gateway.
}
