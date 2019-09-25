import camelCase from 'camelcase';

import { KeyStore } from '@oasislabs/confidential';
import { bytes } from '@oasislabs/common';

import { RpcError, ServiceError, NO_CODE_ERROR_MSG } from './error';
import { Idl, IdlError, RpcFn, RpcInput } from './idl';
import { ServiceOptions } from './service';
import { OasisGateway, RpcOptions } from './oasis-gateway';
import { RpcCoder } from './coder';
import ConfidentialCoder from './coder/confidential';
import { OasisCoder } from './coder/oasis';
import { header } from './deploy/header';

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

type RpcDefinition = {
  rpc: Rpc;
  name: string;
};

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
    address: Uint8Array,
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
      const rpcDef = RpcFactory.buildRpc(
        fn,
        address,
        options.gateway!,
        rpcCoder
      );
      rpcs[rpcDef.name] = rpcDef.rpc;
    });

    return [rpcs, rpcCoder];
  }

  private static buildRpc(
    fn: RpcFn,
    address: Uint8Array,
    gateway: OasisGateway,
    rpcCoder: Promise<RpcCoder>
  ): RpcDefinition {
    if (fn.name === '_inner') {
      throw new IdlError('the _inner name is reserved by the oasis-client');
    }

    const name = RpcFactory.rpcName(fn.name);

    const rpc = async (...args: any[]) => {
      let coder = await rpcCoder;
      let [rpcArgs, rpcOptions] = RpcFactory.parseOptions(
        fn,
        args,
        gateway,
        coder
      );
      let txData = await coder.encode(fn, rpcArgs, rpcOptions);
      let response = await gateway!.rpc({
        data: txData,
        address: address,
        options: rpcOptions,
      });

      if (response.error) {
        let errorStr = await coder.decodeError(response.error);
        throw new Error(errorStr);
      }

      return coder.decode(fn, bytes.parseHex(response.output));
    };

    return {
      rpc,
      name,
    };
  }

  /**
   * Transforms the given `idlName` into a properly formatted
   * snakeCase rpc name to be exposed on the service client.
   */
  private static rpcName(idlName: string): string {
    return camelCase(idlName);
  }

  private static parseOptions(
    fn: RpcFn,
    args: any[],
    gateway: OasisGateway,
    rpcCoder: RpcCoder
  ): [any[], RpcOptions | undefined] {
    let [rpcArgs, rpcOptions] = RpcFactory.splitArgsAndOptions(fn, args);
    RpcFactory.validateRpcOptions(gateway, rpcCoder, rpcArgs, rpcOptions);
    return [rpcArgs, rpcOptions];
  }

  private static splitArgsAndOptions(
    fn: RpcFn,
    args: any[]
  ): [any[], RpcOptions | undefined] {
    let options = undefined;

    let inputLen = fn.inputs ? fn.inputs.length : 0;
    if (args.length > inputLen) {
      if (args.length !== inputLen + 1) {
        throw new Error('provided too many arguments ${args}');
      }
      const arg = args.pop();
      options = arg ? JSON.parse(JSON.stringify(arg)) : undefined;
    }

    return [args, options];
  }

  /**
   * Asserts the given `rpcOptions` are well formed.
   * When signing transactions in the client, confidential services
   * must have the gasLimit specified by the user, since estimateGas
   * is not available. When signing is done by a remote gateway, e.g.,
   * the developer-gateway, this requirement is not enforced.
   */
  private static validateRpcOptions(
    gateway: OasisGateway,
    rpcCoder: RpcCoder,
    rpcArgs: any[],
    rpcOptions?: RpcOptions
  ) {
    if (gateway.hasSigner()) {
      if (rpcCoder instanceof ConfidentialCoder) {
        if (!rpcOptions || !rpcOptions.gasLimit) {
          throw new RpcError(
            rpcArgs,
            rpcOptions,
            `gasLimit must be specified when signing a transaction to a confidential service`
          );
        }
      }
    }
  }

  /**
   * discover finds out if the contract at `address` is confidential.
   *
   * @returns the OasisCoder to use based upon whether it's confidential.
   */
  private static async discover(
    address: Uint8Array,
    options: ServiceOptions
  ): Promise<RpcCoder> {
    // Check the contract's deploy header to see if it's confidential.
    let response = await options.gateway!.getCode({ address });

    if (!response.code) {
      throw new ServiceError(address, NO_CODE_ERROR_MSG(address));
    }

    let deployHeader = header.parseFromCode(response.code!);

    if (!deployHeader || !deployHeader.body.confidential) {
      return OasisCoder.plaintext();
    }

    let keyStore = new KeyStore(options.db!, options.gateway!);
    let serviceKey = await keyStore.publicKey(address);
    let myKeyPair = keyStore.localKeys();
    return OasisCoder.confidential({
      peerPublicKey: serviceKey,
      publicKey: myKeyPair.publicKey,
      privateKey: myKeyPair.privateKey,
    });
  }
}
