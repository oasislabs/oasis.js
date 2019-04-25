import { Idl, RpcFn } from './idl';
import { Address } from './types';
import { Rpcs, RpcFactory } from './rpc';
import { EventEmitter } from 'events';
import { Provider, WebsocketProvider } from './provider';

/**
 * Service is the object representation of an Oasis rpc service.
 */
export default class Service {
  public rpc: Rpcs;
  public address?: Address;

  private idl: Idl;

  /**
   * The Service constructor to dynamically generate service objects from a
   * given idl.
   *
   * @returns a service with all rpc methods attached to it.
   *
   * @param idl is the Idl definition generated for the Oasis service.
   * @param address? is the address of the currently deployed
   * @param options? are the optinos configuring the Service client.
   */
  public constructor(idl: Idl, address?: Address, options?: ServiceOptions) {
    options = this.setupOptions(options);

    // Attach the rpcs onto the rpc interface so that we can generate dynamic
    // rpc methods while keeping the compiler happy. Without this, we need
    // to use a types file when using a service within TypeScript.
    this.rpc = RpcFactory.build(idl, options);
    // Attach the rpcs directly onto the Service object so that we can have
    // the nice service.myMethod() syntax in JavaScript.
    Object.assign(this, this.rpc);

    this.idl = idl;
    this.address = address;
  }

  /**
   * setupOptions configures the options for the Service.
   *
   * @param   options is the options argument given to the constructor.
   * @returns the options to be used for this service, filling in any
   *          options left out by the given options.
   */
  private setupOptions(options?: ServiceOptions): ServiceOptions {
    if (options === undefined) {
      options = defaultOptions();
    }
    Object.assign(options, defaultOptions);
    return options;
  }
}

export type ServiceOptions = {
  provider: Provider;
};

function defaultOptions(): ServiceOptions {
  return {
    provider: new WebsocketProvider('wss://web3.oasiscloud.io')
  };
}
