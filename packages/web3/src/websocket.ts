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
 *
 * Some RPCs like oasis_invoke are synchronous at the gateway and so this is
 * a bit high. We should bring this down once we remove all synchrous rpcs.
 */
const REQUEST_TIMEOUT_DURATION = 30000;

export class JsonRpcWebSocket implements JsonRpc {
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
   * Creates websocket connections.
   */
  private websocketFactory: WebSocketFactory;

  /**
   * This counts how many websocket errors we've encountered without an `open` event.
   */
  private consecutiveErrors = 0;

  /**
   * True iff we want to close the websocket immediately when it is opened.
   * This is set when we are asked to close the websocket in the middle of
   * establishing a connection, which we can't do; hence this hack.
   */
  private closeOnOpen = false;

  /**
   * connectionState emits `trouble` and `ok` events.
   */
  // TODO: this should be typed to be an event emitter once we address
  //       https://github.com/oasislabs/oasis-client/issues/25
  public connectionState: any = new EventEmitter();

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
  }

  private addEventListeners() {
    this.websocket.addEventListener('message', this.message.bind(this));
    this.websocket.addEventListener('open', this.open.bind(this));
    this.websocket.addEventListener('error', this.error.bind(this));
    this.websocket.addEventListener('close', this.close.bind(this));
  }

  private removeEventListeners() {
    this.websocket.removeEventListener('message', this.message);
    this.websocket.removeEventListener('open', this.open);
    this.websocket.removeEventListener('error', this.error);
    this.websocket.removeEventListener('close', this.close);
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
    const data = JSON.parse(m.data);
    this.responses.emit(`${data.id}`, data);
  }

  private open(_event: any) {
    this.lifecycle.emit('open');

    // We were asked to close this websocket while connecting,
    // so finish the jobn.
    if (this.closeOnOpen) {
      this.websocket.close(CloseEvent.NORMAL);
      return;
    }

    if (this.consecutiveErrors >= ERROR_FORWARD_THRESHOLD) {
      // We have notified our consumer of connection trouble, so now notify
      // them that we've reconnected.
      this.connectionState.emit('ok');
    }
    this.consecutiveErrors = 0;
  }

  private error(_event: any) {
    this.consecutiveErrors++;
    if (this.consecutiveErrors === ERROR_FORWARD_THRESHOLD) {
      // This is when we've crossed the threshold for forwarding the connection
      // trouble condition. Additionally, don't repeatedly notify after we've
      // already notified, until after we successfully reconnect.
      this.connectionState.emit('trouble');
    }
  }

  private close(event: any) {
    this.removeEventListeners();
    if (event.code !== CloseEvent.NORMAL) {
      this.connect();
      return;
    }
  }

  public connect() {
    // @ts-ignore
    this.websocket = this.websocketFactory.make(this.url);
    this.addEventListeners();
  }

  public disconnect() {
    // The websocket is open so go ahead and close it.
    if (this.websocket.readyState === this.websocket.OPEN) {
      this.websocket.close(CloseEvent.NORMAL);
    }
    // The websocket is in the middle of establishing a connection.
    // We can't close a websocket if it's not open, so wait for it
    // to be open then close.
    else if (this.websocket.readyState === this.websocket.CONNECTING) {
      this.closeOnOpen = true;
    }
  }

  public request(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      // WebSocket is not open, so wait until it's open and try again.
      if (this.websocket.readyState !== this.websocket.OPEN) {
        this.lifecycle.once('open', () => {
          this.request(request)
            .then(resolve)
            .catch(console.error);
        });
        return;
      }

      // Websocket is open so proceed.
      const id = this.nextId();

      // Function invoked when a response event on topic `id` is emitted.
      const responseListener = (jsonResponse: any) => {
        clearTimeout(timeout);

        if (jsonResponse.error) {
          reject(jsonResponse.error);
        } else {
          resolve(jsonResponse);
        }
      };

      // Set timeout for this request.
      const timeout = setTimeout(() => {
        this.responses.removeListener(responseListener as any);
        const error = new JsonRpcWebSocketError(
          request,
          `request timeout ${REQUEST_TIMEOUT_DURATION} ms have passed`
        );
        reject(error);
      }, REQUEST_TIMEOUT_DURATION);

      this.responses.once(`${id}`, responseListener);

      this.websocket.send(
        JSON.stringify({
          id,
          jsonrpc: '2.0',
          method: request.method,
          params: request.params,
        })
      );
    });
  }

  private nextId(): number {
    this.requestId += 1;
    return this.requestId - 1;
  }
}

enum CloseEvent {
  NORMAL = 1000,
}

export interface Middleware {
  handle(message: any): any | undefined;
}

export interface JsonRpc {
  request(request: JsonRpcRequest): Promise<JsonRpcResponse>;
}

export type JsonRpcRequest = {
  method: string;
  params: any[];
};

export type JsonRpcResponse = {
  result?: any;
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
    return typeof WebSocket !== 'undefined'
      ? // Browser.
        new WebSocket(url)
      : // Node.
        new (require('ws'))(url);
  }
}
