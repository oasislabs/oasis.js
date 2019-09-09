import { JsonRpcWebSocket, WebSocketFactory } from '../src/websocket';

describe('JsonRpcWebSocket', () => {
  it('Timeout requests that have not received a response', async () => {
    // We expect the test to take ~30000 ms.
    jest.setTimeout(31000);

    // Given a JsonRpcWebSocet.
    let ws = new JsonRpcWebSocket('', [], new MockWebSocketFactory());

    try {
      // When I make a request that never resolves.
      await ws.request({
        method: 'someMethod',
        params: [],
      });
      expect(true).toEqual(false);
    } catch (e) {
      // Then the promise should timeout.
      expect(e.message).toEqual('request timeout 30000 ms have passed');
    }
  });
});

class MockWebSocketFactory implements WebSocketFactory {
  make(url: string): WebSocket {
    return new NeverResolveWebSocket() as WebSocket;
  }
}

class NeverResolveWebSocket {
  addEventListener(event: string, fn: Function) {}
  close(code: number) {}
  send(data: string) {}
}
