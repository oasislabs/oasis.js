import { JsonRpcWebSocket, WebSocketFactory } from '../src/gateway/websocket';

describe('JsonRpcWebSocket', () => {
  // Tests that requests will still receive a valid response (via retry),
  // in the case of a simulated network disruption.
  it('Resends pending requests when reconnecting', async () => {
    let ws = new JsonRpcWebSocket('test', [], new MockWebSocketFactory());

    // Keep the websocket shut off so that it drops all messages.
    MOCK_WEB_SOCKET_ADMIN.off();

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
      MOCK_WEB_SOCKET_ADMIN.on();

      // Force close the websocket to trigger a reconnection,
      // and finally receive a response for the original request.
      // @ts-ignore
      ws.websocket.close(0);
    });

    // Ensure we retried (so two requests).
    expect(MOCK_WEB_SOCKET_ADMIN.requests).toEqual([
      { id: 0, jsonrpc: '2.0', method: 'someMethod', params: [] },
      { id: 0, jsonrpc: '2.0', method: 'someMethod', params: [] }
    ]);
    // Response received.
    expect(response).toEqual({
      id: 0,
      success: true
    });
  });

  it('Timeout requests that have not received a response', async () => {
    // We expect the test to take ~5000 ms.
    jest.setTimeout(6000);

    // Given a JsonRpcWebSocet.
    let ws = new JsonRpcWebSocket('', [], new MockWebSocketFactory(false));

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
  constructor(private resolve = true) {}

  make(url: string): WebSocket {
    return (this.resolve
      ? new DisruptedWebSocket()
      : new NeverResolveWebSocket()) as WebSocket;
  }
}

class MockWebsocketAdmin {
  // If on, this websocket will send responses.
  public isOn = true;

  // All requests sent through any DisruptedWebSocket.
  public requests: any[] = [];

  // Disables the websocket from processing requests.
  public off() {
    this.isOn = false;
  }

  // Enables the websocket to process requests.
  public on() {
    this.isOn = true;
  }
}

class NeverResolveWebSocket {
  addEventListener(event: string, fn: Function) {}
  close(code) {}
  send(data: string) {}
}

class DisruptedWebSocket {
  // Delegate callbacks for websocket events, e.g., `message`, `close`, etc.
  private listeners = new Map();

  // MARK: WebSocket Interface

  // @implements WebSocket.
  public readyState = true;

  // @implements WebSocket.
  public OPEN = true;

  constructor() {
    // Give the client of the websocket a chance to addEventListeners before opening.
    setTimeout(() => {
      this.listeners.get('open')({});
    }, 500);
  }

  // @implements WebSocket.
  public addEventListener(event: string, fn: Function) {
    this.listeners.set(event, fn);
  }

  // @implements WebSocket.
  public close(code) {
    this.listeners.get('close')({ code });
  }

  // @implements WebSocket.
  public send(requestData: string) {
    const structuredRequestData = JSON.parse(requestData);

    MOCK_WEB_SOCKET_ADMIN.requests.push(structuredRequestData);

    if (MOCK_WEB_SOCKET_ADMIN.isOn) {
      this.listeners.get('message')({
        data: JSON.stringify({
          id: structuredRequestData.id,
          success: true
        })
      });
    } else {
      // Eat the message. Nom. Nom.
    }
  }
}

const MOCK_WEB_SOCKET_ADMIN = new MockWebsocketAdmin();
