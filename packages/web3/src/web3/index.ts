import Web3Provider from './provider';
import WEB3_RPC_METHODS from './methods';

/**
 * Web3 JSON RPC implementation.
 *
 * Spec: https://github.com/ethereum/wiki/wiki/JSON-RPC
 *
 * Supported namespaces:
 *
 * - `eth`
 * - `oasis`
 * - `net`
 *
 * Note that the Web3 object merely exposes the raw underlying RPC methods.
 * This means that the responses will be the raw results given back from the
 * rpc server. However, there is one exception: subscriptions, which are not
 * formally a part of the web3 JSON rpc spec. Here, subscriptions created
 * via Web3.eth.subscribe will return an event emitter that can be used to
 * listen for `data` events.
 */
export class Web3 {
  /**
   * `eth_*` web3 rpc methods.
   */
  public eth: Web3Namespace;

  /**
   * `oasis_*` web3 rpc methods.
   */
  public oasis: Web3Namespace;

  /**
   * `net_*` web3 rpc methods.
   */
  public net: Web3Namespace;

  constructor(readonly provider: Web3Provider) {
    const rpcs = this.generateWeb3Rpcs();

    this.eth = rpcs.eth;
    this.oasis = rpcs.oasis;
    this.net = rpcs.net;
  }

  /**
   * @returns an object wth all the web3 rpc methods attached.
   *
   * TODO: validate inputs to the web3 rpc methods. For now, just let the
   *       remote gateway do the rejecting if invalid args are provided.
   */
  private generateWeb3Rpcs() {
    const generatedRpcs = { eth: {}, oasis: {}, net: {} };
    WEB3_RPC_METHODS.forEach(rpc => {
      const [namespace, method] = rpc.method.split('_');
      (generatedRpcs as any)[namespace][method] = async (...params: any[]) => {
        const rpcMethod = `${namespace}_${method}`;
        return this.provider.send(rpcMethod, params);
      };
    });
    return generatedRpcs;
  }
}

/**
 * Represents a valid web3 namespace.
 */
export type Web3Namespace = any;

export { Web3Provider };
