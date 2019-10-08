import { EventEmitter } from 'eventemitter3';
import { SubscribeTopic } from '@oasislabs/service';
import { Http } from './http';
import {
  DeveloperGatewayApi,
  ServicePollApi,
  SubscribePollApi,
  Event,
} from './api';

export default class PollingService {
  /**
   * Instances of PollingService, one for each unique developer gateway url, used.
   */
  private static SERVICES: Map<string, PollingService> = new Map();

  /**
   * responses emits events when new responses are retrieved from the developer
   * gateway. Event names are the request ids given by the developer gateway.
   * Values are the responses themselves.
   */
  // @ts-ignore
  private responses: EventEmitter;

  /**
   * responseWindow is the datastructure tracking the request id's for which we have
   * not received responses.
   */
  private responseWindow: Window<Event>;

  /**
   * interval is the polling interval in milliseconds.
   */
  private interval: number;

  /**
   * The timeout object actively being polled. If undefined, then polling is off.
   */
  private polling?: any;

  /**
   * Millisecond timestamp representing the last time we received an event response
   * from the gateway. When IDLE_TIMELAPSE milliseconds have passed, the
   * PollingService is considered idle and stops.
   */
  private lastResponseTs: number;

  /**
   * Amount of time that can pass before being considered idle.
   */
  private static IDLE_TIMELAPSE = 1000 * 60;

  /**
   * The constructor should never be invoked directly. To access the PollingService
   * use `PollingService.instance`.
   */
  private constructor(
    private session: Http,
    private queueId?: number,
    responseWindow?: Window<Event>,
    interval?: number
  ) {
    this.responseWindow = responseWindow ? responseWindow : new Window();
    this.interval = interval ? interval : 1000;
    this.responses = new EventEmitter();
    this.lastResponseTs = Date.now();
  }

  /**
   * @returns the instance of PollingService for the given url.
   */
  public static instance(options: PollingServiceOptions): PollingService {
    const id = PollingService.id(options);

    if (!PollingService.SERVICES.get(id)) {
      PollingService.SERVICES.set(
        id,
        new PollingService(
          options.session,
          options.queueId,
          // Set the end point of the window to 2**53 if the queueId exists since
          // it implies a subscription and subscriptions never auto close.
          options.queueId !== undefined ? new Window(0, 2 ** 53) : new Window(),
          options.interval
        )
      );
    }
    return PollingService.SERVICES.get(id)!;
  }

  /**
   * @returns the internal identifier for the service specified by the given options.
   *          This identifier is used to track each individual PollingService object
   *          cached in PollingService.SERVICES.
   *
   *          Not only will different polling services be created for each
   *          distinct developer gateway url, but also for each unique message
   *          queue handled by the developer gateway.
   *
   *          For the ServicePollApi, there is a single queue for all responses
   *          related to service apis. For subscriptions, however, there is a
   *          unique queue for each individudual subscription--hence the use of
   *          queueId to form the id.
   */
  private static id(options: PollingServiceOptions): string {
    return options.queueId !== undefined
      ? `${options.url}/${SubscribePollApi}/${options.queueId}`
      : `${options.url}/${ServicePollApi}`;
  }

  /**
   * response is the main api provided by PollingService.
   *
   * @returns a promise that resolves to the dev server's response for the given
   *          requestId.
   * @param   requestId is the id returned when making the initial request to the
   *          gateway.
   */
  public async response(requestId: number): Promise<any> {
    return new Promise(resolve => {
      const cached = this.responseWindow.item(requestId);
      if (cached) {
        return resolve(cached);
      }
      this.responseWindow.extend(requestId);
      this.responses.once(`${requestId}`, (response: Event) => {
        resolve(response);
      });
      if (!this.polling) {
        this.start();
      }
    });
  }

  /**
   * Initiates the polling service to begin polling for responses.
   */
  public start() {
    this.polling = setInterval(this.pollOnce.bind(this), this.interval);
  }

  private async pollOnce() {
    const api = this.api();
    const responses = await this.session.request(api.method, api.url, {
      offset: this.responseWindow.start,
      discardPrevious: true,
      id: this.queueId,
    });
    // No responses so exit. Can remove once this is resolved:
    // https://github.com/oasislabs/developer-gateway/issues/23
    if (!responses.events) {
      if (Date.now() - this.lastResponseTs >= PollingService.IDLE_TIMELAPSE) {
        this.stop();
      }
      return;
    }

    this.lastResponseTs = Date.now();

    responses.events.forEach((r: any) => {
      this.responses.emit(this.topic(r), r);
      this.responseWindow.slide(r.id, r);
      if (this.responseWindow.isClosed()) {
        this.stop();
      }
    });
  }

  /**
   * Force stops the polling service.
   */
  public stop() {
    clearInterval(this.polling);
    this.polling = undefined;
  }

  public subscribe(requestId: number, callback: Function) {
    if (this.polling) {
      throw new Error('cannot make a new subscription when already polling');
    }
    this.responses.addListener(SubscribeTopic, callback);
    this.start();
  }

  /**
   * @returns the DeveloperGatewayApi currently being polled.
   */
  private api(): DeveloperGatewayApi {
    return this.queueId !== undefined ? SubscribePollApi : ServicePollApi;
  }

  /**
   * @returns the topic to publish the given response to.
   */
  private topic(response: Event): string {
    return this.queueId !== undefined ? SubscribeTopic : `${response.id}`;
  }
}

export type PollingServiceOptions = {
  url: string;
  session: Http;
  queueId?: number;
  interval?: number;
};

class Window<T> {
  /**
   * Collected elements in this window. Maps element id to element.
   */
  private collected: Map<number, T> = new Map();

  /**
   * start is the offset of the first element in the window we want.
   */
  public start: number;

  /**
   * end is the offset of the last element in the window we want, exclusive.
   */
  public end: number;

  constructor(start?: number, end?: number) {
    this.start = start !== undefined ? start : -1;
    this.end = end !== undefined ? end : -1;
  }

  /**
   * Extend the window to wait for the given element id.
   */
  public extend(id: number) {
    // First time extending so set the start as well.
    if (this.isClosed()) {
      this.start = id;
      this.end = id + 1;
    }
    // Push out the edge of the window.
    else if (id >= this.end) {
      this.end = id + 1;
    }
  }

  /**
   * Slide accrues the given item into the cache and advances the window start
   * if it's the next contiguous item.
   */
  public slide(id: number, item: T) {
    this.collected.set(id, item);
    if (id === this.start) {
      const start = this.start;
      for (let k = start; k < this.end; k += 1) {
        if (this.collected.get(k)) {
          this.start += 1;
        } else {
          break;
        }
      }
    }
    if (this.start > this.end) {
      this.end = this.start + 1;
    }
  }

  /**
   * @returns true when all elements in this window have been collected.
   */
  public isClosed(): boolean {
    return this.start === this.end;
  }

  /**
   * @returns the item at the given window slot id.
   */
  public item(id: number): T | undefined {
    return this.collected.get(id);
  }
}
