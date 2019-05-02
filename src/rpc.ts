import { Idl, RpcFn, RpcInput } from './idl';
import { ServiceOptions } from './service';
import { Provider } from './provider';
import RpcCoder from './coder';
import { Address } from './types';
import { KeyStore } from './confidential';

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
  /**
   * provider is the interface for making network requests to the gateway.
   */
  private provider: Provider;
  /**
   * coder is the rpc encoder and decoder, transforming to/from an idl and input to
   * the serialized wire format. Note that this is a promise because we cannot
   * code an RPC request without *first* knowing if a Service is confidential or
   * not, and so we must make a request to the key store and await the response
   * before using the coder.
   */
  private coder: Promise<RpcCoder>;

  /**
   * @param address is the address of the service for which we want to encode.
   * @param options are the ServiceOptions used to configure the service.
   */
  public constructor(address: Address, keyStore: KeyStore, provider: Provider) {
    this.provider = provider;

    this.coder = new Promise(async resolve => {
      // Ask the key store if this service is confidential.
      let serviceKey = await keyStore.publicKey(address);
      // No key so the contract is not confidential. Don't encrypt.
      if (!serviceKey) {
        return resolve(RpcCoder.plaintext());
      }
      // A service key exists so it's confidential. Encrypt.
      let myKeyPair = keyStore.localKeys();
      resolve(
        RpcCoder.confidential({
          peerPublicKey: serviceKey,
          publicKey: myKeyPair.publicKey,
          privateKey: myKeyPair.privateKey
        })
      );
    });
  }

  /**
   * build dynamically generates RPC methods.
   *
   * @returns an object with all the RPC methods attached.
   */
  public static build(
    idl: Idl,
    address: Address,
    options: ServiceOptions
  ): Rpcs {
    let keyStore = new KeyStore(options.db!, options.provider);
    let factory = new RpcFactory(address, keyStore, options.provider!);

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
      let coder = await this.coder;
      let txData = await coder.encode(fn, args);
      let request = { data: txData, method: 'oasis_rpc' };
      return this.provider.send(request);
    };
  }
}
