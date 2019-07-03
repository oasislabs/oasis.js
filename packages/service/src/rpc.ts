import { KeyStore } from '@oasis/confidential';
import { Address } from '@oasis/types';

import { Idl, RpcFn, RpcInput } from './idl';
import { ServiceOptions } from './service';
import { OasisGateway, RpcOptions } from './oasis-gateway';
import { RpcCoder } from './coder';
import { OasisCoder } from './coder/oasis';

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
   * build dynamically generates RPC methods.
   *
   * @returns an object with all the RPC methods attached.
   */
  public static build(
    idl: Idl,
    address: Address,
    options: ServiceOptions
  ): [Rpcs, Promise<RpcCoder>] {
    let functions = options.coder
      ? options.coder.functions(idl)
      : OasisCoder.plaintext().functions(idl);
    let rpcCoder: Promise<RpcCoder> = new Promise(resolve => {
      options.coder
        ? resolve(options.coder)
        : RpcFactory.discover(address, options).then(resolve);
    });

    let rpcs: Rpcs = {};

    functions.forEach((fn: RpcFn) => {
      rpcs[fn.name] = async (...args: any[]) => {
        let coder = await rpcCoder;
        let [rpcArgs, rpcOptions] = RpcFactory.parseOptions(fn, args);
        let txData = await coder.encode(fn, rpcArgs, rpcOptions);
        let response = await options.gateway!.rpc({
          data: txData,
          address: address,
          options: rpcOptions
        });
        return coder.decode(fn, response.output);
      };
    });

    return [rpcs, rpcCoder];
  }

  private static parseOptions(
    fn: RpcFn,
    args: any[]
  ): [any[], RpcOptions | undefined] {
    let options = undefined;

    let inputLen = fn.inputs ? fn.inputs.length : 0;
    if (args.length > inputLen) {
      if (args.length !== inputLen + 1) {
        throw new Error('provided too many arguments ${args}');
      }
      options = JSON.parse(JSON.stringify(args.pop()));
    }
    return [args, options];
  }

  /**
   * discover finds out if the contract at `address` is confidential.
   *
   * @returns the OasisCoder to use based upon whether it's confidential.
   */
  private static async discover(
    address: Address,
    options: ServiceOptions
  ): Promise<RpcCoder> {
    let keyStore = new KeyStore(options.db, options.gateway!);
    // Ask the key store if this service is confidential.
    let serviceKey = await keyStore.publicKey(address);
    // No key so the contract is not confidential. Don't encrypt.
    if (!serviceKey) {
      return OasisCoder.plaintext();
    }
    // A service key exists so it's confidential. Encrypt.
    let myKeyPair = keyStore.localKeys();

    return OasisCoder.confidential({
      peerPublicKey: serviceKey,
      publicKey: myKeyPair.publicKey,
      privateKey: myKeyPair.privateKey
    });
  }
}
