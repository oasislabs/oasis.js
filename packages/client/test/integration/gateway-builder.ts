import { keccak256 } from 'js-sha3';
import {
  ServicePollApi,
  SubscribePollApi,
  SubscribeApi,
  PollingService,
  HttpDeveloperGateway,
  Http
} from '@oasis/developer-gateway';
import { Address } from '@oasis/types';
import { bytes, cbor } from '@oasis/common';

/**
 * Builds a gateway with all HTTP requests mocked out.
 */
export default class GatewayBuilder {
  private serviceResponses: any = [];
  private subscribeResponses: any = [];

  public deploy(address: string): GatewayBuilder {
    // Deploy response.
    this.addServiceResponse({
      event: { address }
    });
    // getPublicKey response.
    this.addServiceResponse({
      event: {}
    });
    return this;
  }

  public rpc(output: any): GatewayBuilder {
    this.addServiceResponse({
      event: { output: output }
    });
    return this;
  }

  public subscribe(event: Object): GatewayBuilder {
    let encodedEvent = bytes.toHex(cbor.encode(event));
    let log = { data: encodedEvent };
    let data = Buffer.from(JSON.stringify(log)).toString('hex');

    this.addSubscribeResponse({
      event: { data }
    });

    return this;
  }

  public gateway(): HttpDeveloperGateway {
    let url = 'test';
    let gateway = new HttpDeveloperGateway(url);
    let session = new MockSession(
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
    let subscriptionPoll = PollingService.instance({
      url: url,
      queueId: 0
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
 * MockSession mocks out the http response from the developer gateway.
 * Supports a single subscription at a time.
 */
class MockSession implements Http {
  // Flag for enabling/disabling logging to see what requests would be going to/from
  // the dev gateway. Useful for debugging.
  private logging = false;

  // For more organized logging.
  private loggingLine = '--------------------------------';

  private count: number = 0;

  public constructor(
    private serviceResponses: any[],
    private subscribeResponses: any[]
  ) {}

  public async post(api: string, body: any): Promise<any> {
    if (this.logging) {
      console.debug(
        `request:  ${api}\n${this.loggingLine}\n${JSON.stringify(body)}}`
      );
    }

    let response = await this._post(api, body);

    if (this.logging) {
      console.debug(
        `response: ${api}\n${this.loggingLine}\n${JSON.stringify(response)}`
      );
    }

    return response;
  }

  private async _post(api: string, body: any): Promise<any> {
    // Service execution.
    if (api === ServicePollApi) {
      this.count += 1;
      return {
        offset: body.offset,
        events: [this.serviceResponses[body.offset].event]
      };
    }
    // Subscription log.
    else if (api === SubscribePollApi) {
      if (body.offset >= this.subscribeResponses.length) {
        return { offset: body.offset, events: null };
      }
      return {
        offset: body.offset,
        events: [this.subscribeResponses[body.offset].event]
      };
    }
    // Subscribe queue id (handles the initial, non-poll request).
    else if (api === SubscribeApi) {
      // The mock only supports a single queue so just use 0 as the queueId.
      return { id: 0 };
    }
    // Service poll offset (handles the initial, non-poll request).
    else {
      return { id: this.count };
    }
  }
}
