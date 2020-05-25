import { BaseLogger, default as pino } from 'pino';
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
  private log?: BaseLogger;
  public constructor() {
    try {
      this.log = pino({
        name: 'http-client',
        timestamp: pino.stdTimeFunctions.isoTime, // ISO format instead of epoch
        serializers: { err: pino.stdSerializers.err },
        level: process?.env?.OASIS_SDK_LOG_LEVEL ?? 'silent',
      });
    } catch {
      // Cannot initialize logging; maybe OASIS_SDK_LOG_LEVEL is not a valid level name.
      // Ignore and skip logging.
    }
  }

  /**
   * Returns a string representation of `data` object suitable for debug printing.
   * Similar to `JSON.stringify()`, but clips long string values so they don't overwhelm the output.
   */
  private conciseDebugRepr(data: any) {
    let dataDigest: Record<string, any> = {}; // like `data`, but with long fields clipped
    for (const key of Object.getOwnPropertyNames(data)) {
      const valStr = data[key]?.toString() || 'undefined';
      dataDigest[key] =
        valStr.slice(0, 100) + (valStr.size === 100 ? '...' : '');
    }
    return dataDigest;
  }

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
    if (this.log?.isLevelEnabled('trace')) {
      this.log?.trace(
        { data: this.conciseDebugRepr(data), headers },
        `Making HTTP request to ${url}`
      );
    }
    return axios
      .request({ method, url, data, headers })
      .catch(err => {
        this.log?.warn({ err }, `HTTP request to ${url} failed`);
        throw err;
      })
      .then(val => {
        this.log?.trace(
          { http_response: this.conciseDebugRepr(val.data) },
          `Received HTTP response from ${url}`
        );
        return val;
      });
  }
}
