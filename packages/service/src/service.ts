import { EventEmitter } from 'eventemitter3';
import { Address, Db, LocalStorage } from '@oasislabs/common';
import { Idl, fromWasm } from './idl';
import { Rpcs, RpcFactory } from './rpc';
import { RpcCoder } from './coder';
import { DeployHeaderReader } from './deploy/header';
import { OasisGateway, defaultOasisGateway } from './oasis-gateway';
import { ServiceError, NO_CODE_ERROR_MSG } from './error';

/**
 * Service is the object representation of an Oasis rpc service.
 */
export class Service {
  /**
   * The generated rpcs for this service, defined by a given IDL.
   */
  public rpc: Rpcs;

  /**
   * The address of the deployed service.
   */
  public address: Address;

  /**
   * The inner variables required to implement the Service object. We reserve
   * the `_inner` namespace so that service methods defined by an IDL don't
   * override/clash with the internal variables. This is required so that we
   * can support the convenient `service.myMethod()` syntax in JavaScript.
   * It's expected no IDL used will have an _inner rpc method.
   */
  private _inner: ServiceInner;

  /**
   * The Service constructor to dynamically generate service objects from a
   * given idl.
   *
   * @returns a service with all rpc methods attached to it.
   *
   * @param idl is the Idl definition generated for the Oasis service.
   * @param address? is the address of the currently deployed service.
   * @param options? are the options configuring the Service client.
   */
  public constructor(idl: Idl, address: Address, options?: ServiceOptions) {
    // Fill in any options not provided by the arguments.
    options = Service.setupOptions(options);

    // Attach the rpcs onto the rpc interface so that we can generate dynamic
    // rpc methods while keeping the compiler happy. Without this, we need
    // to use a types file when using a service within TypeScript.
    const [rpc, coder] = RpcFactory.build(idl, address, options);
    this.rpc = rpc;

    // Attach the rpcs directly onto the Service object so that we can have
    // the nice service.myMethod() syntax in JavaScript.
    Object.assign(this, rpc);

    this.address = address;
    this._inner = {
      idl,
      options,
      coder,
      listeners: new EventEmitter(),
      subscriptions: new Map(),
    };
  }

  /**
   * Constructs a service object from a given `address` by fetching the on-
   * chain wasm and extracting the idl.
   */
  public static async at(
    address: Address,
    options?: ServiceOptions
  ): Promise<Service> {
    options = Service.setupOptions(options);
    const response = await options.gateway!.getCode({ address: address.bytes });

    if (!response.code) {
      throw new ServiceError(address, NO_CODE_ERROR_MSG(address));
    }

    const wasm = DeployHeaderReader.initcode(response.code);
    const idl = await fromWasm(wasm);
    return new Service(idl, address, options);
  }

  /**
   * setupOptions configures the options for the Service.
   *
   * @param   options is the options argument given to the constructor.
   * @returns the options to be used for this service, filling in any
   *          options left out by the given options.
   */
  private static setupOptions(options?: ServiceOptions): ServiceOptions {
    if (options === undefined) {
      options = defaultOptions();
    } else {
      // Remove all undefined fields so that Object.assign overwrites them.
      Object.keys(options).forEach(key => {
        if ((options! as any)[key] === undefined) {
          delete (options! as any)[key];
        }
      });
      options = assignDefaultOptions(options);
    }
    return options;
  }

  /**
   * addEventListener is the api to register for observing service events.
   *
   * @param event is the name of the event to listen to.
   * @param callback is the callback to call when an event is emitted in the
   *        case where listener options are provided as the second argument.
   */
  public addEventListener(event: string, callback: Listener) {
    // Register the listener. We allow many for a single event subscription.
    this._inner.listeners.addListener(event, callback);

    let subscription = this._inner.subscriptions.get(event);
    if (subscription !== undefined) {
      // The subscription is already setup so exit.
      return;
    }

    this._inner.coder
      .then(coder => {
        // Create the subscription.
        subscription = this._inner.options.gateway!.subscribe({
          event,
          filter: {
            address: this.address.bytes,
            topics: [coder.topic(event, this._inner.idl)],
          },
        });
        // Save the subscription so that we can remove it on demand.
        this._inner.subscriptions.set(event, subscription);

        // Decode the gateway's response and return it to the listener.
        subscription.addListener(event, async (e: any) => {
          const decoded = await coder.decodeSubscriptionEvent(
            e,
            this._inner.idl
          );

          this._inner.listeners.emit(event, decoded);
        });
      })
      .catch(err => {
        console.error(`${err}`);
      });
  }

  public removeEventListener(event: string, listener: Listener) {
    const subscription = this._inner.subscriptions.get(event);
    if (subscription === undefined) {
      throw new ServiceError(
        this.address,
        `no subscriptions found for ${event}`
      );
    }

    this._inner.listeners.removeListener(event, listener);

    // Remove the subscription if no listeners remain.
    if (this._inner.listeners.listeners(event).length === 0) {
      this._inner.options.gateway!.unsubscribe({ event });
      this._inner.subscriptions.delete(event);
    }
  }
}

/**
 * The private state variables used by the `Service` object.
 */
type ServiceInner = {
  /**
   * Configurable options for the Service.
   */
  options: ServiceOptions;

  /**
   * Internal event emitter to track registration for the both the
   * add/removeEventListener apis.
   */
  // @ts-ignore
  listeners: EventEmitter;

  /**
   * Maps event names to subscriptions to the OasisGateway. For each
   * event, we can have no more than a single subscription (though many
   * listeners can register for each event/subscription).
   */
  // @ts-ignore
  subscriptions: Map<string, EventEmitter>;

  /**
   * idl defines the service's interface.
   */
  idl: Idl;

  /**
   * coder encodes all rpcs and subscriptions to the service. Wrapped in a
   * promise because it must wait to know whether the coder should be
   * confidential or not, which requires a request to the gateway.
   */
  coder: Promise<RpcCoder>;
};

/**
 * Options for adding a a service event listener.
 */
type ListenerOptions = {
  filter?: Record<string, any>;
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
  coder?: RpcCoder;
};

function assignDefaultOptions(options: ServiceOptions): ServiceOptions {
  if (!options.gateway) {
    options.gateway = defaultOasisGateway();
  }
  if (!options.db) {
    options.db = new LocalStorage();
  }
  return options;
}

function defaultOptions(): ServiceOptions {
  return {
    gateway: defaultOasisGateway(),
    db: new LocalStorage(),
  };
}
