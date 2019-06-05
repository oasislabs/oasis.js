import axios from 'axios';

/**
 * Http interface for making http requests to the developer gateway.
 */
export interface Http {
  post(api: string, body: Object): Promise<any>;
}

export class HttpRequest implements Http {
  public constructor(public url: string) {}

  public async post(api: string, body: Object): Promise<any> {
    const uri = `${this.url}/${api}`;
    let response = await axios.post(uri, body, {
      headers: {
        'X-OASIS-INSECURE-AUTH': 'example',
        'X-OASIS-SESSION-KEY': 'example-session',
        'Content-type': 'application/json'
      }
    });
    return response.data;
  }
}
