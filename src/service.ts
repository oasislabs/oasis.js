import { Idl, RpcFn } from './idl';
import { Address } from './types';
import { Rpcs, RpcFactory } from './rpc';
import {
  OasisGateway,
  defaultOasisGateway,
  SubscribeRequest,
  SubscribeTopic
} from './oasis-gateway';
import { Db, LocalStorage } from './db';
import keccak256 from './utils/keccak256';
import * as bytes from './utils/bytes';
import cbor from './utils/cbor';
import EventEmitter from './utils/eventemitter3';

/**
 * Service is the object representation of an Oasis rpc service.
 */
export default class Service {
  public rpc: Rpcs;
  public address: Address;

  private idl: Idl;
  private options: ServiceOptions;

  /**
   * Internal event emitter to track registration for the both the
   * add/removeEventListener apis.
   */
  // @ts-ignore
  private listeners: EventEmitter;

  /**
   * Maps event names to subscriptions to the OasisGateway. For each
   * event, we can have no more than a single subscription (though many
   * listeners can register for each event/subscription).
   */
  // @ts-ignore
  private subscriptions: Map<string, EventEmitter>;

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
    this.listeners = new EventEmitter();
    this.subscriptions = new Map();
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
      // Remove all undefined fields so that Object.assign overwrites them.
      Object.keys(options).forEach(key => {
        if (options![key] === undefined) {
          delete options![key];
        }
      });
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
  public addEventListener(event: string, callback: Listener) {
    // Register the listener. We allow many for a single event subscription.
    this.listeners.addListener(event, callback);

    let subscription = this.subscriptions.get(event);
    if (subscription !== undefined) {
      // The subscription is already setup so exit.
      return;
    }

    // Create and save the subscription.
    subscription = this.options.gateway!.subscribe({
      event,
      filter: {
        address: this.address,
        topics: [keccak256(event)]
      }
    });
    this.subscriptions.set(event, subscription);

    // Decode the gateway's response and return it to the listener.
    subscription.addListener(event, e => {
      e = cbor.decode(
        bytes.parseHex(
          JSON.parse(Buffer.from(e.data, 'hex').toString('utf-8')).data
        )
      );
      this.listeners.emit(event, e);
    });
  }

  public removeEventListener(event: string, listener: Listener) {
    let subscription = this.subscriptions.get(event);
    if (subscription === undefined) {
      throw new Error(`no subscriptions found for ${event}`);
    }

    this.listeners.removeListener(event, listener);

    // Remove the subscription if no listeners remain.
    if (this.listeners.listeners(event).length === 0) {
      this.options.gateway!.unsubscribe({ event });
      this.subscriptions.delete(event);
    }
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
