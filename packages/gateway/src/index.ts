import { EventEmitter } from 'eventemitter3';
import {
  OasisGateway,
  RpcRequest,
  RpcResponse,
  SubscribeRequest,
  SubscribeFilter,
  UnsubscribeRequest,
  SubscribeTopic,
  DeployRequest,
  DeployResponse,
  PublicKeyRequest,
  PublicKeyResponse,
  GetCodeRequest,
  GetCodeResponse,
} from '@oasislabs/service';
import { bytes } from '@oasislabs/common';
import PollingService from './polling';
import {
  Event,
  ExecuteServiceEvent,
  ErrorEvent,
  PublicKeyEvent,
  DeployEvent,
  DeployApi,
  DeveloperGatewayApi,
  RpcApi,
  PublicKeyApi,
  SubscribeApi,
  ServicePollApi,
  SubscribePollApi,
  GetCodeApi,
  HealthApi,
  UnsubscribeApi,
} from './api';
import { HttpHeaders, Http } from './http';
import { HttpSession } from './session';

// Re-export.
export {
  Http,
  HttpGateway,
  ServicePollApi,
  SubscribeApi,
  SubscribePollApi,
  GetCodeApi,
  PollingService,
};

export default class Gateway implements OasisGateway {
  private inner: OasisGateway;

  public connectionState: any = new EventEmitter();

  constructor(url: string, apiToken: string, headers: HttpHeaders) {
    // TODO: WebSocket gateway and extract protocol from url.
    this.inner = new HttpGateway(url, apiToken, headers);
  }

  public async deploy(request: DeployRequest): Promise<DeployResponse> {
    return this.inner.deploy(request);
  }

  public async rpc(request: RpcRequest): Promise<RpcResponse> {
    return this.inner.rpc(request);
  }

  public subscribe(request: SubscribeRequest): any {
    return this.inner.subscribe(request);
  }

  public unsubscribe(request: UnsubscribeRequest) {
    return this.inner.unsubscribe(request);
  }

  public async publicKey(
    request: PublicKeyRequest
  ): Promise<PublicKeyResponse> {
    return this.inner.publicKey(request);
  }

  public async getCode(request: GetCodeRequest): Promise<GetCodeResponse> {
    return this.inner.getCode(request);
  }

  public disconnect() {
    this.inner.disconnect();
  }

  public hasSigner(): boolean {
    return this.inner.hasSigner();
  }
}

class HttpGateway implements OasisGateway {
  /**
   * http makes network requests to the gateway.
   */
  private session: Http;

  /**
   * polling collects all non-subscribe responses from the developer gateway.
   */
  private polling: PollingService;

  /**
   * Maps event name to the polling service queueId. One for each subscription.
   */
  private subscriptions: Map<string, number>;

  private connectionStateDummy = new EventEmitter();

  public constructor(
    private url: string,
    private apiToken: string,
    private headers: HttpHeaders
  ) {
    this.session = new HttpSession(url, apiToken, headers);
    this.polling = PollingService.instance({
      url: url,
      session: this.session,
    });
    this.subscriptions = new Map();
  }

  /**
   * Sanity check that the gateway is constructed with the correct url.
   */
  private assertGatewayIsResponsive(url: string): Promise<undefined> {
    return new Promise(async (resolve, reject) => {
      let timeout = setTimeout(() => {
        reject(new Error(`Couldn't connect to gateway ${url}`));
      }, 3000);

      try {
        await this.session.request(HealthApi.method, HealthApi.url, {});
      } catch (e) {
        if (e.message !== 'Request failed with status code 404') {
          reject(e);
        } else {
          clearTimeout(timeout);
          resolve();
        }
      }
    });
  }

  public async deploy(request: DeployRequest): Promise<DeployResponse> {
    let e = await this.postAndPoll(DeployApi, {
      data: bytes.toHex(request.data),
    });
    let event = e as DeployEvent;
    let address = bytes.parseHex(event.address);
    return { address };
  }

  public async rpc(request: RpcRequest): Promise<RpcResponse> {
    if (request.options) {
      throw new Error(
        'transaction options are not allowed by the developer gateway'
      );
    }
    let event = await this.postAndPoll(RpcApi, {
      data: bytes.toHex(request.data),
      address: bytes.toHex(request.address!),
    });
    // todo: the developer gateway should have an error if the transaction
    //       reverted.
    return {
      output: (event as ExecuteServiceEvent).output,
    };
  }

  // TODO: this should be typed to return an event emitter once we address
  //       https://github.com/oasislabs/oasis-client/issues/25
  public subscribe(request: SubscribeRequest): any {
    let events = new EventEmitter();
    this.session
      .request(SubscribeApi.method, SubscribeApi.url, {
        events: ['logs'],
        filter: urlEncodeFilter(request.filter!),
      })
      .then(response => {
        if (response.id === undefined || response.id === null) {
          throw new Error(`subscription failed: ${response}`);
        }
        // Store the event -> queueId mapping so that we can unsubscribe later.
        this.subscriptions.set(request.event, response.id);
        PollingService.instance({
          url: this.url,
          session: this.session,
          queueId: response.id,
        }).subscribe(response.id, (event: any) => {
          events.emit(request.event, event);
        });
      })
      .catch(err => {
        events.emit('error', err);
      });

    return events;
  }

  public unsubscribe(request: UnsubscribeRequest) {
    let queueId = this.subscriptions.get(request.event);
    if (queueId === undefined) {
      throw new Error(`no subscriptions exist for ${JSON.stringify(request)}`);
    }

    // Cleanup the client's subscription.
    PollingService.instance({
      url: this.url,
      session: this.session,
      queueId,
    }).stop();
    this.subscriptions.delete(request.event);

    // Cleanup the gateway's subscription.
    this.session
      .request(UnsubscribeApi.method, UnsubscribeApi.url, {
        id: queueId,
      })
      .catch(err => {
        console.error(`Error unsubscribing from gateway: ${err}`);
      });
  }

  public async publicKey(
    request: PublicKeyRequest
  ): Promise<PublicKeyResponse> {
    const response = await this.session.request(
      PublicKeyApi.method,
      PublicKeyApi.url,
      {
        address: bytes.toHex(request.address!),
      }
    );

    let event: PublicKeyEvent = response as PublicKeyEvent;

    // TODO: validate signature
    //       https://github.com/oasislabs/oasis-client/issues/39

    let publicKey = event.publicKey
      ? bytes.parseHex(event.publicKey)
      : undefined;
    return { publicKey };
  }

  /**
   * Performs the asynchronous developer gateway request by posting a request
   * and then polling for the response.
   */
  private async postAndPoll(
    api: DeveloperGatewayApi,
    body: Object
  ): Promise<Event> {
    const response = await this.session.request(api.method, api.url, body);
    let event = await this.polling.response(response.id);
    if ((event as ErrorEvent).cause) {
      throw new Error(`poll error: ${JSON.stringify(event)}`);
    }
    return event;
  }

  public async getCode(request: GetCodeRequest): Promise<GetCodeResponse> {
    let response = await this.session.request(
      GetCodeApi.method,
      GetCodeApi.url,
      {
        address: bytes.toHex(request.address!),
      }
    );
    return {
      code: bytes.parseHex(response.code),
    };
  }

  public disconnect() {
    // no-op
  }

  // todo: change any to EventEmitter.
  //       https://github.com/oasislabs/oasis-client/issues/25
  public connectionState(): any {
    // `deploy` et al. don't hide connection problems, so no need to emit these events.
    return this.connectionStateDummy;
  }

  public hasSigner(): boolean {
    return false;
  }
}

function urlEncodeFilter(filter: SubscribeFilter): string {
  return (
    `address=${bytes.toHex(filter.address)}` +
    '&' +
    filter.topics.map((t: string) => 'topic=' + t).join('&')
  );
}
