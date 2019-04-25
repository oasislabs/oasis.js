import { Idl, RpcFn, RpcInput } from './idl';
import { ServiceOptions } from './service';
import { Provider } from './provider';
import { RpcEncoder, PlaintextRpcEncoder } from './encoder';

/**
 * Rpcs is a dynamically generated object with rpc methods attached.
 */
export interface Rpcs {
  [key: string]: Rpc;
}

/**
 * Rpc is a single rpc method.
 */
export type Rpc = (...args: any[]) => Promise<any>;

/**
 * RpcFactory builds an Rpcs object for a given idl.
 */
export class RpcFactory {
  private provider: Provider;
  private encoder: Promise<RpcEncoder>;

  public constructor(provider: Provider) {
    this.provider = provider;
    this.encoder = new Promise(resolve => {
      // TODO: make call to oasis_getPublicKey and use a confidential encoder if key is non-null.
      resolve(new PlaintextRpcEncoder());
    });
  }

  /**
   * build dynamically generates RPC methods.
   *
   * @returns an object with all the RPC methods attached.
   */
  public static build(idl: Idl, options: ServiceOptions): Rpcs {
    let factory = new RpcFactory(options.provider);

    let rpcs: Rpcs = {};

    idl.functions.forEach((fn: RpcFn) => {
      rpcs[fn.name] = factory.rpc(idl, fn);
    });

    return rpcs;
  }

  /**
   * rpc constructs a method.
   *
   * @returns an invokable rpc function that makes a request to an oasis service.
   */
  private rpc(idl: Idl, fn: RpcFn): Rpc {
    return async (...args: any[]) => {
      let encoder = await this.encoder;
      let txData = await encoder.encode(fn, args);
      let request = { data: txData, method: 'oasis_rpc' };
      return this.provider.send(request);
    };
  }
}
