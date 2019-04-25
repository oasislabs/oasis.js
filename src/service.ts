import { Idl, RpcFn } from './idl';
import RpcFactory from './rpc-factory';
import { Rpcs, Events } from './types';
import { EventEmitter } from 'events';

export default class Service {
  public rpc: Rpcs;
  public events: Events;

  /**
   * The Service initializer.
   *
   * @param idl is the Idl definition generated for the Oasis service.
   * @param options are the optinos configuring the Service client.
   */
  public constructor(idl: Idl, options?: ServiceOptions) {
    options = this.setupOptions(options);
    this.rpc = this.buildRpcs(idl, options);
    this.events = this.buildEvents(idl, options);
  }

  /**
   * setupOptions configures the options for tthe Service.
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

  /**
   * buildRpcs dynamically attaches RPC methods to the service object.
   */

  private buildRpcs(idl: Idl, options: ServiceOptions) {
    let factory = new RpcFactory(options);

    let rpcs: Rpcs = {};

    idl.functions.forEach((fn: RpcFn) => {
      rpcs[fn.name] = factory.rpc(idl, fn);
    });

    return rpcs;
  }

  /**
   * buildEvents dynamically attaches event emitters to the service object.
   */
  private buildEvents(idl: Idl, options: ServiceOptions) {
    // todo
    return {
      MyEvent: new EventEmitter()
    };
  }
}

export type ServiceOptions = {
  url: string;
  keyManager: string;
};

function defaultOptions(): ServiceOptions {
  return {
    url: 'wss://web3.oasiscloud.io',
    keyManager: 'todo'
  };
}
