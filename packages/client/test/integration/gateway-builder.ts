import {
  ServicePollApi,
  SubscribePollApi,
  SubscribeApi,
  GetCodeApi,
  PollingService,
  HttpGateway,
  Http,
} from '@oasislabs/gateway';
import { bytes, cbor } from '@oasislabs/common';

/**
 * Builds a gateway with all HTTP requests mocked out.
 */
export default class GatewayBuilder {
  private serviceResponses: any = [];
  private subscribeResponses: any = [];

  public deploy(address: string): GatewayBuilder {
    // Deploy response.
    this.addServiceResponse({
      event: { address },
    });
    return this;
  }

  public rpc(output: any): GatewayBuilder {
    this.addServiceResponse({
      event: { output: bytes.toHex(cbor.encode(output)) },
    });
    return this;
  }

  public subscribe(event: Record<string, any>): GatewayBuilder {
    const data = bytes.toHex(cbor.encode(event));
    this.addSubscribeResponse({
      event: { data },
    });

    return this;
  }

  public gateway(): HttpGateway {
    const url = 'test';
    const dummyApiToken = 'LPbGhl6lGxaFDHgHF5N8CNZ32a3MgE+IfmutjxEb3FWt4WwP';
    const gateway = new HttpGateway(url, dummyApiToken, { headers: new Map() });
    const session = new MockSession(
      this.serviceResponses,
      this.subscribeResponses
    );
    // @ts-ignore
    gateway.session = session;
    // @ts-ignore
    gateway.polling.session = session;
    // @ts-ignore
    gateway.polling.interval = 100;

    // One subscription is allowed for this mock gateway, so preset it's polling
    // parameters.
    const subscriptionPoll = PollingService.instance({
      url: url,
      queueId: 0,
      session: session,
    });
    // @ts-ignore
    subscriptionPoll.session = session;
    // @ts-ignore
    subscriptionPoll.interval = 100;
    return gateway;
  }

  /**
   * The response will have a request id based upon its position in the serviceResponses
   * array.
   */
  private addServiceResponse(response: any) {
    response.event.id = this.serviceResponses.length;
    this.serviceResponses.push(response);
  }

  private addSubscribeResponse(response: any) {
    response.event.id = this.subscribeResponses.length;
    this.subscribeResponses.push(response);
  }
}

/**
 * MockSession mocks out the http response from the gateway.
 * Supports a single subscription at a time.
 */
class MockSession implements Http {
  // Flag for enabling/disabling logging to see what requests would be going to/from
  // the dev gateway. Useful for debugging.
  private logging = false;

  // For more organized logging.
  private loggingLine = '--------------------------------';

  private count = 0;

  public constructor(
    private serviceResponses: any[],
    private subscribeResponses: any[]
  ) {}

  public async request(method: string, api: string, body: any): Promise<any> {
    if (this.logging) {
      console.debug(
        `request:  ${api}\n${this.loggingLine}\n${JSON.stringify(body)}}`
      );
    }

    const response = await this._request(method, api, body);

    if (this.logging) {
      console.debug(
        `response: ${api}\n${this.loggingLine}\n${JSON.stringify(response)}`
      );
    }

    return response;
  }

  private async _request(method: string, api: string, body: any): Promise<any> {
    // Service execution.
    if (api === ServicePollApi.url && method == ServicePollApi.method) {
      this.count += 1;
      return {
        offset: body.offset,
        events: [this.serviceResponses[body.offset].event],
      };
    }
    // Subscription log.
    else if (
      api === SubscribePollApi.url &&
      method == SubscribePollApi.method
    ) {
      if (body.offset >= this.subscribeResponses.length) {
        return { offset: body.offset, events: null };
      }
      return {
        offset: body.offset,
        events: [this.subscribeResponses[body.offset].event],
      };
    }
    // Subscribe queue id (handles the initial, non-poll request).
    else if (api === SubscribeApi.url && method == SubscribeApi.method) {
      // The mock only supports a single queue so just use 0 as the queueId.
      return { id: 0 };
    }
    // Dummy get code response.
    else if (api === GetCodeApi.url && method == GetCodeApi.method) {
      return { code: '0x00' };
    }
    // Service poll offset (handles the initial, non-poll request).
    else {
      return { id: this.count };
    }
  }
}
