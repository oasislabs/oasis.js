import { HttpSession } from '../src/session';
import { HttpClient } from '../src/http';

class HttpMockClient implements HttpClient {
  public uri: string = '';
  public body: Object = {};
  public opts: Object = {};

  public post(uri: string, body: Object, opts: Object): Promise<any> {
    this.uri = uri;
    this.body = body;
    this.opts = opts;
    return new Promise((resolve, _) => resolve({ data: 'response' }));
  }
}

describe('SessionService', () => {
  it('Sends post request with default headers', async () => {
    const map = new Map();
    map.set('X-OASIS-INSECURE-AUTH', 'VALUE');
    const headers = { headers: map };
    const client = new HttpMockClient();

    const session = new HttpSession('http://myurl', headers, client);
    let res = await session.post('myapi', { data: 'data' });

    expect(res).toEqual('response');
    expect(client.uri).toEqual('http://myurl/myapi');
    expect(client.body).toEqual({ data: 'data' });
    expect(client.opts['headers']['Content-type']).toEqual('application/json');
    expect(client.opts['headers']['X-OASIS-INSECURE-AUTH']).toEqual('VALUE');
    expect(client.opts['headers']['X-OASIS-SESSION-KEY'].length).toEqual(36);
  });
});
