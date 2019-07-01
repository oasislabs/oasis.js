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
  GetCodeResponse
} from '@oasis/service';
import { Address, PublicKey, Bytes } from '@oasis/types';
import { UrlEncoder, bytes } from '@oasis/common';
import PollingService from './polling';
import {
  Event,
  ExecuteServiceEvent,
  ErrorEvent,
  PublicKeyEvent,
  DeployEvent,
  DeployApi,
  RpcApi,
  PublicKeyApi,
  SubscribeApi,
  ServicePollApi,
  SubscribePollApi
} from './api';
import { Http } from './http';
import { HttpSession } from './session';

// Re-export.
export {
  Http,
  HttpDeveloperGateway,
  ServicePollApi,
  SubscribeApi,
  SubscribePollApi,
  PollingService
};

export default class DeveloperGateway implements OasisGateway {
  private inner: OasisGateway;

  constructor(url: string) {
    // TODO: WebSocket gateway and extract protocol from url.
    this.inner = new HttpDeveloperGateway(url);
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
}

class HttpDeveloperGateway implements OasisGateway {
  /**
   * http makes network requests to the gateway.
   */
  private session: Http;

  /**
   * polling collects all non-subscribe fresponses from the developer gateway.
   */
  private polling: PollingService;

  /**
   * Maps event name to the polling service queueId. One for each subscription.
   */
  private subscriptions: Map<string, number>;

  public constructor(private url: string) {
    this.session = new HttpSession(url);
    this.polling = PollingService.instance({
      url: url,
      session: this.session
    });
    this.subscriptions = new Map();
  }

  public async deploy(request: DeployRequest): Promise<DeployResponse> {
    let e = await this.postAndPoll(DeployApi, {
      data: bytes.toHex(request.data)
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
      address: bytes.toHex(request.address!)
    });
    return {
      output: (event as ExecuteServiceEvent).output
    };
  }

  // TODO: this should be typed to return an event emitter once we address
  //       https://github.com/oasislabs/oasis-client/issues/25
  public subscribe(request: SubscribeRequest): any {
    let events = new EventEmitter();
    this.session
      .post(SubscribeApi, {
        events: ['logs'],
        filter: urlEncodeFilter(request.filter)
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
          queueId: response.id
        }).subscribe(response.id, event => {
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
      throw new Error(`no subscriptions exist for ${request}`);
    }

    PollingService.instance({
      url: this.url,
      session: this.session,
      queueId
    }).stop();

    this.subscriptions.delete(request.event);
  }

  public async publicKey(
    request: PublicKeyRequest
  ): Promise<PublicKeyResponse> {
    let e = await this.postAndPoll(PublicKeyApi, {
      address: bytes.toHex(request.address)
    });
    let event: PublicKeyEvent = e as PublicKeyEvent;

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
  private async postAndPoll(url: string, body: Object): Promise<Event> {
    const response = await this.session.post(url, body);
    let event = await this.polling.response(response.id);
    if ((event as ErrorEvent).cause) {
      throw new Error(`poll error: ${JSON.stringify(event)}`);
    }
    return event;
  }

  public async getCode(request: GetCodeRequest): Promise<GetCodeResponse> {
    throw new Error('unimplemented!');
  }
}

function urlEncodeFilter(filter: SubscribeFilter): string {
  return (
    `address=${bytes.toHex(filter.address)}` +
    '&' +
    filter.topics.map(t => 'topic=' + t).join('&')
  );
}
