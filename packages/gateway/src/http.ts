import axios, { Method } from 'axios';

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
  request(method: string, api: string, body: Record<string, any>): Promise<any>;
}

/**
 * HttpClient for underlying http client implementations
 */
export interface HttpClient {
  request(
    method: string,
    url: string,
    data: Record<string, any>,
    headers: HttpHeaders
  ): Promise<any>;
}

/**
 * AxiosClient is an implementation of an HttpClient using the
 * axios library as the underlying implementation
 */
export class AxiosClient implements HttpClient {
  public request(
    method: Method,
    url: string,
    data: Record<string, any>,
    httpHeaders: HttpHeaders
  ): Promise<any> {
    const headers: Record<string, any> = {};
    httpHeaders.headers.forEach(
      (value, key) => ((headers as any)[key] = value)
    );
    return axios.request({ method, url, data, headers });
  }
}
