import { HttpSession } from '../src/session';
import { HttpClient, HttpHeaders } from '../src/http';

class HttpMockClient implements HttpClient {
  public method = '';
  public uri = '';
  public body: Record<string, any> = {};
  public headers: HttpHeaders = { headers: new Map() };

  public request(
    method: string,
    uri: string,
    body: Record<string, any>,
    headers: HttpHeaders
  ): Promise<any> {
    this.method = method;
    this.uri = uri;
    this.body = body;
    this.headers = headers;
    return new Promise(resolve => resolve({ data: 'response' }));
  }
}

describe('SessionService', () => {
  it('Sends post request with default headers', async () => {
    const map = new Map();
    map.set('X-OASIS-INSECURE-AUTH', 'VALUE');
    const headers = { headers: map };
    const client = new HttpMockClient();

    const dummyApiToken = 'LPbGhl6lGxaFDHgHF5N8CNZ32a3MgE+IfmutjxEb3FWt4WwP';
    const session = new HttpSession(
      'http://myurl',
      dummyApiToken,
      headers,
      client
    );
    const res = await session.request('method', 'myapi', { data: 'data' });

    expect(res).toEqual('response');
    expect(client.method).toEqual('method');
    expect(client.uri).toEqual('http://myurl/myapi');
    expect(client.body).toEqual({ data: 'data' });
    expect(client.headers.headers.get('Content-type')).toEqual(
      'application/json'
    );
    expect(client.headers.headers.get('X-OASIS-INSECURE-AUTH')).toEqual(
      'VALUE'
    );
    const sessionKey = client.headers.headers.get('X-OASIS-SESSION-KEY');
    expect(sessionKey).not.toBe(undefined);
    if (sessionKey) {
      expect(sessionKey.length).toEqual(36);
    }
  });
});
