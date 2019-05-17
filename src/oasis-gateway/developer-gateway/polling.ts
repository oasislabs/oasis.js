import EventEmitter from '../../utils/eventemitter3';
import { Http, HttpRequest } from './http';
import { Event } from './api';

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
   * The constructor should never be invoked diriectly. To access the PollingService
   * use `PollingService.instance`.
   */
  private constructor(
    private http: Http,
    responseWindow?: Window<Event>,
    interval?: number
  ) {
    this.responseWindow = responseWindow ? responseWindow : new Window();
    this.interval = interval ? interval : 1000;
    this.responses = new EventEmitter();
  }

  /**
   * @returns the instance of PollingService for the given url.
   */
  public static instance(
    url: string,
    http?: Http,
    interval?: number
  ): PollingService {
    if (!PollingService.SERVICES.get(url)) {
      PollingService.SERVICES.set(
        url,
        new PollingService(
          http ? http : new HttpRequest(url),
          undefined,
          interval
        )
      );
    }
    return PollingService.SERVICES.get(url)!;
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
      let cached = this.responseWindow.item(requestId);
      if (cached) {
        return resolve(cached);
      }
      this.responseWindow.extend(requestId);
      if (!this.polling) {
        this.start();
      }
      this.responses.once(`${requestId}`, (response: Event) => {
        resolve(response);
      });
    });
  }

  /**
   * Initiates the polling service to begin polling for responses.
   */
  private start() {
    this.polling = setInterval(this.pollOnce.bind(this), this.interval);
  }

  private async pollOnce() {
    let responses = await this.http.post('v0/api/service/poll', {
      offset: this.responseWindow.start,
      discardPrevious: true
    });
    // No responses so exit. Can remove once this is resolved:
    // https://github.com/oasislabs/developer-gateway/issues/23
    if (!responses.events) {
      return;
    }
    responses.events.forEach(r => {
      this.responses.emit(`${r.id}`, r);
      this.responseWindow.slide(r.id, r);
      if (this.responseWindow.isClosed()) {
        // Stop polling because we have accrued all desired responses.
        clearInterval(this.polling);
        this.polling = undefined;
      }
    });
  }
}

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
    this.start = start ? start : -1;
    this.end = end ? end : -1;
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
   * Slide accrues the given item inito the cache and advances the window start
   * if it's the next contiguous item.
   */
  public slide(id: number, item: T) {
    this.collected.set(id, item);
    if (id === this.start) {
      let start = this.start;
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
