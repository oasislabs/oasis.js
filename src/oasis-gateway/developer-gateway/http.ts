import {
  OasisGateway,
  RpcRequest,
  SubscribeRequest,
  DeployRequest,
  DeployResponse,
  PublicKeyRequest,
  PublicKeyResponse
} from '../';
import { Address, PublicKey, Bytes } from '../../types';
import PollingService from './polling';
import * as bytes from '../../utils/bytes';
import axios from 'axios';
import * as EventEmitter from 'eventemitter3';
import DeveloperGateway from './index';
import {
  Event,
  ExecuteServiceEvent,
  ErrorEvent,
  PublicKeyEvent,
  DeployEvent
} from './api';

export class HttpDeveloperGateway implements OasisGateway {
  /**
   * http makes network requests to the gateway.
   */
  private http: Http;

  /**
   * polling is the pllinig service collectiing all responses from the developer gateway.
   */
  private polling: PollingService;

  public constructor(private url: string) {
    this.http = new HttpRequest(url);
    this.polling = PollingService.instance(url);
  }

  public async deploy(request: DeployRequest): Promise<DeployResponse> {
    let e = await this.postAndPoll('v0/api/service/deploy', {
      data: request.data
    });
    let event = e as DeployEvent;
    let address = bytes.parseHex(event.address);
    return { address };
  }

  public async rpc(request: RpcRequest): Promise<any> {
    let event = await this.postAndPoll('v0/api/service/execute', {
      data: bytes.toHex(request.data),
      address: bytes.toHex(request.address as Bytes)
    });
    return (event as ExecuteServiceEvent).output;
  }

  public subscribe(request: SubscribeRequest): EventEmitter {
    // TODO
    return new EventEmitter();
  }

  public async publicKey(
    request: PublicKeyRequest
  ): Promise<PublicKeyResponse> {
    let e = await this.postAndPoll('v0/api/service/getPublicKey', {
      address: bytes.toHex(request.address)
    });
    let event: PublicKeyEvent = e as PublicKeyEvent;

    // TODO: validate signature
    //       https://github.com/oasislabs/oasis-client/issues/39

    let publicKey = bytes.parseHex(event.publicKey);
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
      throw new Error(`poll error: ${event}`);
    }
    return event;
  }
}

/**
 * Http interface for making http requests to the developer gateway.
 */
export interface Http {
  post(api: string, body: Object): Promise<any>;
}

export class HttpRequest implements Http {
  public constructor(public url: string) {}

  public async post(api: string, body: Object): Promise<any> {
    const uri = `${this.url}/${api}`;
    let response = await axios.post(uri, body, {
      headers: {
        'X-INSECURE-AUTH': 'example',
        'Content-type': 'application/json'
      }
    });
    return response.data;
  }
}
