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
    this.headers =
      this.headers && this.headers.headers
        ? this.headers
        : { headers: new Map() };
    this.client = client ? client : new AxiosClient();
  }

  public async request(
    method: string,
    api: string,
    body: Object
  ): Promise<any> {
    const uri = `${this.url}/${api}`;
    const headers: HttpHeaders = { headers: new Map() };
    headers.headers.set('X-OASIS-SESSION-KEY', this.sessionKey);
    headers.headers.set('Content-type', 'application/json');

    this.headers.headers.forEach((value, key) =>
      headers.headers.set(key, value)
    );

    let response = await this.client.request(method, uri, body, headers);
    return response.data;
  }
}
