import axios from 'axios';
import uuid from 'uuid';
import { Http } from './http';

export type Session = Http;

export class SessionRequest implements Session {
  /**
   * session key passed to the developer gateway in the header.
   */
  private sessionKey: string;

  public constructor(public url: string) {
    this.sessionKey = uuid.v4();
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
