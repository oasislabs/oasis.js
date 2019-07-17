import { AxiosClient, HttpClient, HttpHeaders, Http } from './http';

import * as _uuid from 'uuid';

let uuid: any = undefined;

// Browser.
/* tslint:disable */
if (typeof window !== 'undefined') {
  // @ts-ignore
  uuid = _uuid.default;
}
// Node.
else {
  uuid = require('uuid');
}

export class HttpSession implements Http {
  /**
   * session key passed to the developer gateway in the header.
   */
  private sessionKey: string;

  /**
   * headers are the default headers that the session will use for all
   * http requests
   */
  private headers: HttpHeaders;

  /**
   * underlying http client for the http requests
   */
  private client: HttpClient;

  public constructor(
    public url: string,
    headers: HttpHeaders,
    client?: HttpClient
  ) {
    this.sessionKey = uuid.v4();
    this.headers = headers;
    this.client = client ? client : new AxiosClient();
  }

  public async post(api: string, body: Object): Promise<any> {
    const uri = `${this.url}/${api}`;
    const headers = {
      'X-OASIS-SESSION-KEY': this.sessionKey,
      'Content-type': 'application/json'
    };

    this.headers.headers.forEach((value, key) => (headers[key] = value));

    let response = await this.client.post(uri, body, { headers });
    return response.data;
  }
}
