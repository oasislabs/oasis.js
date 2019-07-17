import axios from 'axios';

/**
 * HttpHeaders that can be sent on an http request
 */
export type HttpHeaders = {
  headers: Map<string, string>;
};

/**
 * Http interface for making http requests to the developer gateway.
 */
export interface Http {
  post(api: string, body: Object): Promise<any>;
}

/**
 * HttpClient for underlying http client implementations
 */
export interface HttpClient {
  post(uri: string, body: Object, opts: Object): Promise<any>;
}

/**
 * AxiosClient is an implementation of an HttpClient using the
 * axios library as the underlying implementation
 */
export class AxiosClient implements HttpClient {
  public post(uri: string, body: Object, opts: Object): Promise<any> {
    return axios.post(uri, body, opts);
  }
}
