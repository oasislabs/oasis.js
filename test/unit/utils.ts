import { Provider, Request } from '../../src/provider';

/**
 * RequestMockProvider is a mock provider to pull out the request sent to a provider.
 */
export class RequestMockProvider implements Provider {
  /**
   * @param requestResolve is a promise's resolve function returning the
   *        request received by this provider.
   */
  constructor(private requestResolve: Function) {}

  async send(request: Request): Promise<any> {
    this.requestResolve(request);
  }
}
