import { AxiosClient, HttpClient, HttpHeaders, Http } from './http';

import * as _uuid from 'uuid';

let uuid: any = undefined;
let URL: any = undefined;

// Browser.
if (typeof window !== 'undefined') {
  // @ts-ignore
  uuid = _uuid.default;
  URL = window.URL;
}
// Node.
else {
  uuid = require('uuid');
  URL = require('url').URL;
}

export class HttpSession implements Http {
  /**
   * The gateway base url.
   */
  public url: string;

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
    url: string,
    public apiToken: string,
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
    this.url = url + (url.endsWith('/') ? '' : '/');
  }

  public async request(
    method: string,
    api: string,
    body: Record<string, any>
  ): Promise<any> {
    const url = this.url + api;
    const headers: HttpHeaders = { headers: new Map() };
    headers.headers.set('X-OASIS-INSECURE-AUTH', '1');
    headers.headers.set('X-OASIS-LOGIN-TOKEN', this.apiToken);
    headers.headers.set('X-OASIS-SESSION-KEY', this.sessionKey);
    headers.headers.set('Content-type', 'application/json');

    this.headers.headers.forEach((value, key) =>
      headers.headers.set(key, value)
    );

    const response = await this.client.request(method, url, body, headers);
    return response.data;
  }
}
