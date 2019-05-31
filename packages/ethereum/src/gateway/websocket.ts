import * as EventEmitter from 'eventemitter3';
import { WebSocket } from '@oasis/types';

export class JsonRpcWebSocket {
  /**
   * responses implements a request-response pattern for `send` requests.
   */
  private responses: EventEmitter = new EventEmitter();

  /**
   * Middleware to plug into the websocket connection. Processes ws messages
   * prior to the default handler defined here.
   */
  private middleware: Middleware[];

  /**
   * JSON rpc request id auto counter.
   */
  private requestId: number = 0;

  /**
   * lifecycle emits events pertaining to the lifecycle of the websocket,
   * e.g., when it opens or closes.
   */
  private lifecycle: EventEmitter = new EventEmitter();

  /**
   * WebSocket through which all requests are sent.
   */
  private websocket: WebSocket;

  constructor(private url: string, middleware: Middleware[]) {
    this.middleware = middleware;
    // @ts-ignore
    this.websocket = new WebSocket(this.url);
    this.addEventListeners();
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
  }

  private error(event) {
    this.lifecycle.emit('error');
  }

  private close(event) {
    if (event.code !== CloseEvent.NORMAL) {
      this.connect();
      return;
    }
    this.lifecycle.emit('close');
  }

  public connect() {
    // @ts-ignore
    this.websocket = new WebSocket(this.url);
    this.addEventListeners();
  }

  public disconnect() {
    this.websocket.close(CloseEvent.NORMAL);
  }

  public request(request: JsonRpcRequest): Promise<any> {
    return new Promise(resolve => {
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
      let id = this.nextId();
      this.responses.once(`${id}`, resolve);

      this.websocket.send(
        JSON.stringify({
          id,
          jsonrpc: '2.0',
          method: request.method,
          params: request.params
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
  NORMAL = 1000
}

export type JsonRpcRequest = {
  method: string;
  params: Object[];
};

export interface Middleware {
  handle(message: any): any | undefined;
}
