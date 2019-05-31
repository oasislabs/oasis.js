import {
  OasisGateway,
  RpcRequest,
  RpcResponse,
  SubscribeRequest,
  UnsubscribeRequest,
  SubscribeTopic,
  DeployRequest,
  DeployResponse,
  PublicKeyRequest,
  PublicKeyResponse
} from '@oasis/service';
import { Address, PublicKey, Bytes, EventEmitter } from '@oasis/types';
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
import { Http, HttpRequest } from './http';

// Re-export.
export {
  Http,
  HttpDeveloperGateway,
  ServicePollApi,
  SubscribeApi,
  SubscribePollApi,
  PollingService
};

export default class DeveloperGateway {
  public static http(url: string): OasisGateway {
    return new HttpDeveloperGateway(url);
  }
}

class HttpDeveloperGateway implements OasisGateway {
  /**
   * http makes network requests to the gateway.
   */
  private http: Http;

  /**
   * polling collects all non-subscribe fresponses from the developer gateway.
   */
  private polling: PollingService;

  /**
   * Maps event name to the polling service queueId. One for each subscription.
   */
  private subscriptions: Map<string, number>;

  public constructor(private url: string) {
    this.http = new HttpRequest(url);
    this.polling = PollingService.instance({ url });
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
    this.http
      .post(SubscribeApi, {
        events: ['logs'],
        filter: UrlEncoder.encode(request.filter)
      })
      .then(response => {
        if (response.id === undefined || response.id === null) {
          throw new Error(`subscription failed: ${response}`);
        }

        // Store the event -> queueId mapping so that we can unsubscribe later.
        this.subscriptions.set(request.event, response.id);

        PollingService.instance({
          url: this.url,
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
    const response = await this.http.post(url, body);
    let event = await this.polling.response(response.id);
    if ((event as ErrorEvent).cause) {
      throw new Error(`poll error: ${JSON.stringify(event)}`);
    }
    return event;
  }
}
