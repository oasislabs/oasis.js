import { JsonRpcWebSocket, WebSocketFactory } from '../src/gateway/websocket';

describe('JsonRpcWebSocket', () => {
  // Tests that requests will still receive a valid response (via retry),
  // in the case of a simulated network disruption.
  it('Resends pending requests when reconnecting', async () => {
    let ws = new JsonRpcWebSocket('test', [], new MockWebSocketFactory());

    // Keep the websocket shut off so that it drops all messages.
    MOCK_WEB_SOCKET.off();

    // Make the request in the face of disruption.
    let response = await new Promise(resolve => {
      // Issue request. We shouldn't receive a response yet.
      ws.request({
        method: 'someMethod',
        params: []
      }).then(response => {
        // Final response!
        resolve(response);
      });

      // Now the websocket should send back responses for future requests.
      MOCK_WEB_SOCKET.on();

      // Force close the websocket to trigger a reconnection,
      // and finally receive a response for the original request.
      MOCK_WEB_SOCKET.close(0);
    });

    expect(MOCK_WEB_SOCKET.requests).toEqual([
      // First request.
      { id: 0, jsonrpc: '2.0', method: 'someMethod', params: [] },
      // Retry request.
      { id: 1, jsonrpc: '2.0', method: 'someMethod', params: [] }
    ]);
    // Response should be for the retried request.
    expect(response).toEqual({ id: 1, success: 'this is a response' });
  });

  it('Timeout requests that have not received a response', async () => {
    // We expect the test to take ~5000 ms.
    jest.setTimeout(6000);

    // Given a JsonRpcWebSocet.
    let ws = new JsonRpcWebSocket(
      '',
      [],
      new MockWebSocketFactory(new NeverResolveWebSocket())
    );

    try {
      // When I make a request that never resolves.
      await ws.request({
        method: 'someMethod',
        params: []
      });
      expect(true).toEqual(false);
    } catch (e) {
      // Then the promise should timeout.
      expect(e.message).toEqual('request timeout: 5000 ms have passed');
    }
  });
});

class MockWebSocketFactory implements WebSocketFactory {
  constructor(private ws: any = MOCK_WEB_SOCKET) {}

  make(url: string) {
    return this.ws;
  }
}

class NeverResolveWebSocket {
  addEventListener(event: string, fn: Function) {}
  close() {}
  send(data: string) {}
}

class DisruptedWebSocket {
  // Stores all requests sent through the `send` method.
  public requests = [];

  // Delegate callbacks for websocket events, e.g., `message`, `close`, etc.
  private listeners = new Map();

  // If on, this websocket will send responses.
  public isOn = true;

  // Disables the websocket from processing requests.
  public off() {
    this.isOn = false;
  }

  // Enables the websocket to process requests.
  public on() {
    this.isOn = true;
  }

  // MARK: WebSocket Interface

  // @implements WebSocket.
  public readyState = true;

  // @implements WebSocket.
  public OPEN = true;

  // @implements WebSocket.
  public addEventListener(event: string, fn: Function) {
    this.listeners.set(event, fn);
  }

  // @implements WebSocket.
  public close(code) {
    // Emit a close event with an abnormal exit code.
    // This *should* motivate the user of this websocket to reconnect.
    this.listeners.get('close')({ code });
  }

  // @implements WebSocket.
  public send(requestData: string) {
    const structuredRequestData = JSON.parse(requestData);

    // @ts-ignore
    this.requests.push(structuredRequestData);

    if (this.isOn) {
      this.listeners.get('message')({
        data: JSON.stringify({
          id: structuredRequestData.id,
          success: 'this is a response'
        })
      });
    } else {
      // Eat the message. Nom. Nom.
    }
  }
}

const MOCK_WEB_SOCKET = new DisruptedWebSocket();
