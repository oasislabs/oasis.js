import { EventEmitter } from 'eventemitter3';
import { JsonRpcWebSocketError } from './error';

/**
 * We internally try to handle reconnection when the websocket closes abnormally,
 * but if we encounter a bunch of errors without ever successfully opening a
 * connection, we'll forward a trouble condition to our consumer. This is the
 * number of consecutive errors after which we inform our consumer.
 */
const ERROR_FORWARD_THRESHOLD = 2;

/**
 * Time (in milliseconds) before a request sent through a JsonRpcWebSocket
 * expires.
 */
const REQUEST_TIMEOUT_DURATION = 5000;

export class JsonRpcWebSocket {
  /**
   * responses implements a request-response pattern for `send` requests.
   */
  private responses = new EventEmitter();

  /**
   * Middleware to plug into the websocket connection. Processes ws messages
   * prior to the default handler defined here.
   */
  private middleware: Middleware[];

  /**
   * JSON rpc request id auto counter.
   */
  private requestId = 0;

  /**
   * lifecycle emits events pertaining to the lifecycle of the websocket,
   * e.g., when it opens or closes.
   */
  private lifecycle = new EventEmitter();

  /**
   * WebSocket through which all requests are sent.
   */
  private websocket: WebSocket;

  /**
   * This counts how many websocket errors we've encountered without an `open` event.
   */
  private consecutiveErrors = 0;

  /**
   * connectionState emits `trouble` and `ok` events.
   */
  // TODO: this should be typed to be an event emitter once we address
  //       https://github.com/oasislabs/oasis-client/issues/25
  public connectionState: any = new EventEmitter();

  /**
   * Queue tracking the requests that have been sent but not completed.
   */
  private pendingRequestQueue: PendingRequestQueue;

  /**
   * Creates websocket connections.
   */
  private websocketFactory: WebSocketFactory;

  /**
   * @param url is the websocket url to connect to.
   * @param middleware is the middleware to use to process websocket messages.
   * @param wsFactory? is given as an optional WebSocketFactory implementation
   *        (for testing).
   */
  constructor(
    private url: string,
    middleware: Middleware[],
    wsFactory?: WebSocketFactory
  ) {
    this.middleware = middleware;
    this.websocketFactory = wsFactory ? wsFactory : new EnvWebSocketFactory();
    this.websocket = this.websocketFactory.make(url);
    this.addEventListeners();
    this.pendingRequestQueue = new PendingRequestQueue();
  }

  private addEventListeners() {
    this.websocket.addEventListener('message', this.message.bind(this));
    this.websocket.addEventListener('open', this.open.bind(this));
    this.websocket.addEventListener('error', this.error.bind(this));
    this.websocket.addEventListener('close', this.close.bind(this));
  }

  private message(m: any) {
    m = this.runMiddleware(m);
    if (!m) {
      return;
    }
    this.handler(m);
  }

  private runMiddleware(data: any): any | undefined {
    this.middleware.forEach(m => {
      data = m.handle(data);
      if (!data) {
        return undefined;
      }
    });
    return data;
  }

  private handler(m: any) {
    let data = JSON.parse(m.data);
    this.responses.emit(`${data.id}`, data);
  }

  private open(event) {
    this.lifecycle.emit('open');

    if (this.consecutiveErrors >= ERROR_FORWARD_THRESHOLD) {
      // We have notified our consumer of connection trouble, so now notify
      // them that we've reconnected.
      this.connectionState.emit('ok');
    }
    this.consecutiveErrors = 0;

    this.pendingRequestQueue.all().forEach(pendingReq => {
      this.send(pendingReq);
    });
  }

  private error(event) {
    this.lifecycle.emit('error');

    this.consecutiveErrors++;
    if (this.consecutiveErrors === ERROR_FORWARD_THRESHOLD) {
      // This is when we've crossed the threshold for forwarding the connection
      // trouble condition. Additionally, don't repeatedly notify after we've
      // already notified, until after we successfully reconnect.
      this.connectionState.emit('trouble');
    }
  }

  private close(event) {
    if (event.code !== CloseEvent.NORMAL) {
      this.connect();
      return;
    }
    this.lifecycle.emit('close');
  }

  public connect() {
    this.websocket = this.websocketFactory.make(this.url);
    this.addEventListeners();
  }

  public disconnect() {
    this.websocket.close(CloseEvent.NORMAL);
  }

  public request(request: JsonRpcRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      let id = this.nextId();

      // Set timeout for this request.
      let timeout = (() => {
        const message = `request timeout: ${REQUEST_TIMEOUT_DURATION} ms have passed`;
        return setTimeout(() => {
          this.pendingRequestQueue.remove(id);
          reject(new JsonRpcWebSocketError(request, message));
        }, REQUEST_TIMEOUT_DURATION);
      })();

      const pendingRequest = {
        timeout,
        request,
        resolve,
        reject,
        id
      };

      // Add to the pending request queue.
      this.pendingRequestQueue.add(pendingRequest);

      // Setup response listener.
      this.responses.once(`${id}`, jsonResponse => {
        // Stop tracking this request (we have the response!).
        this.pendingRequestQueue.remove(pendingRequest.id);
        clearTimeout(timeout);

        // Send the response back to the caller through the promise.
        if (jsonResponse.error) {
          reject(jsonResponse.error);
        } else {
          resolve(jsonResponse);
        }
      });

      if (this.websocket.readyState === this.websocket.OPEN) {
        this.send(pendingRequest);
      }
    });
  }

  private send(request: PendingRequest) {
    this.websocket.send(
      JSON.stringify({
        id: request.id,
        jsonrpc: '2.0',
        method: request.request.method,
        params: request.request.params
      })
    );
  }

  private nextId(): number {
    this.requestId += 1;
    return this.requestId - 1;
  }
}

enum CloseEvent {
  NORMAL = 1000
}

export type JsonRpcRequest = {
  method: string;
  params: Object[];
};

export interface Middleware {
  handle(message: any): any | undefined;
}

class PendingRequestQueue {
  /**
   * Maps request id to pendingRequest.
   */
  private requests = {};

  public add(pendingReq: PendingRequest) {
    this.requests[pendingReq.id] = pendingReq;
  }

  public remove(id: number) {
    delete this.requests[id];
  }

  public all() {
    return Object.keys(this.requests).map(k => this.requests[k]);
  }
}

/**
 * Datastructure representing a request that has been sent through the
 * JsonRpcWebSocket, but not necessarily completed.
 */
type PendingRequest = {
  /**
   * The JSON RPC request id.
   */
  id: number;
  /**
   * The original request.
   */
  request: JsonRpcRequest;
  /**
   * The promise resolution function resolving to the request's response.
   */
  resolve: Function;
  /**
   * The promise rejection function resolving to the request's error response.
   */
  reject: Function;
  /**
   * The timeout returned from `setTimeout`. Used to `clearTimeout`.
   */
  timeout;
};

export interface WebSocketFactory {
  make(url: string): WebSocket;
}

/**
 * Creates a WebSocket based upon whether we're in a node or browser
 * environment.
 */
class EnvWebSocketFactory implements WebSocketFactory {
  make(url: string): WebSocket {
    // tslint:disable-next-line
    return typeof WebSocket !== 'undefined'
      ? // Browser.
        new WebSocket(url)
      : // Node.
        new (require('ws'))(url);
  }
}
