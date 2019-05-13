import { Idl, RpcFn } from './idl';
import { Address } from './types';
import { Rpcs, RpcFactory } from './rpc';
import {
  OasisGateway,
  defaultOasisGateway,
  SubscribeRequest
} from './oasis-gateway';
import { Db, LocalStorage } from './db';

/**
 * Service is the object representation of an Oasis rpc service.
 */
export default class Service {
  public rpc: Rpcs;
  public address: Address;

  private idl: Idl;
  private options: ServiceOptions;

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
  public constructor(idl: Idl, address: Address, options?: ServiceOptions) {
    this.options = this.setupOptions(options);

    // Attach the rpcs onto the rpc interface so that we can generate dynamic
    // rpc methods while keeping the compiler happy. Without this, we need
    // to use a types file when using a service within TypeScript.
    this.rpc = RpcFactory.build(idl, address, this.options);
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
    } else {
      options = Object.assign(defaultOptions(), options);
    }
    return options;
  }

  /**
   * addEventListener is the api to register for observing service events.
   *
   * @param event is the name of the event to listen to.
   * @param optionsOrCallback is either the listener options, or, if not defined,
   *        then the callback to call when the event is emitted.
   * @param callback? is the callback to call when an event is emitted in the
   *        case where listener options are provided as the second argument.
   */
  public addEventListener(
    event: string,
    optionsOrCallback: ListenerOptions | Listener,
    callback?: Listener
  ) {
    let filter: Object | undefined = undefined;
    if (typeof optionsOrCallback === 'function') {
      // The second argument is a callback so no options were provided.
      callback = optionsOrCallback;
    } else {
      // The second argument is not a callback, so they are options.
      filter = optionsOrCallback.filter;
    }

    let eventEmitter = this.options.gateway!.subscribe({
      filter,
      event
    });

    eventEmitter.addListener(event, callback as Listener);
  }
}

/**
 * Options for adding a a service event listener.
 */
type ListenerOptions = {
  filter?: Object;
};

/**
 * Listener is a callback method to respond to ServiceEvents.
 */
type Listener = (event: ServiceEvent) => void;

/**
 * An event emitted by  a service object.
 */
type ServiceEvent = any;

export type ServiceOptions = {
  gateway?: OasisGateway;
  db?: Db;
};

function defaultOptions(): ServiceOptions {
  return {
    gateway: defaultOasisGateway(),
    db: new LocalStorage()
  };
}
