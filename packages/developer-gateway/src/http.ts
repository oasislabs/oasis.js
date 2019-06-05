import axios from 'axios';
import _uuid from 'uuid';

let uuid: any = undefined;

// Browser.
/* tslint:disable */
if (typeof window !== 'undefined') {
  uuid = _uuid.v4;
}
// Node.
else {
  uuid = require('uuid/v4');
}
/**
 * Http interface for making http requests to the developer gateway.
 */
export interface Http {
  post(api: string, body: Object): Promise<any>;
}

export class HttpRequest implements Http {
  /**
   * session key passed to the developer gateway in the header.
   */
  private sessionKey: string;

  public constructor(public url: string) {
    this.sessionKey = uuid();
  }

  public async post(api: string, body: Object): Promise<any> {
    const uri = `${this.url}/${api}`;
    let response = await axios.post(uri, body, {
      headers: {
        'X-OASIS-INSECURE-AUTH': 'example',
        'X-OASIS-SESSION-KEY': this.sessionKey,
        'Content-type': 'application/json'
      }
    });
    return response.data;
  }
}
