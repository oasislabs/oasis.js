import { Bytes } from '../src/types';
import * as EventEmitter from 'eventemitter3';

// TODO: https://github.com/oasislabs/oasis-client/issues/12

export interface Provider {
  send(request: RpcRequest): Promise<any>;
  subscribe(request: SubscribeRequest): EventEmitter;
}

export class WebsocketProvider implements Provider {
  public constructor(private url: string) {}

  public async send(request: RpcRequest): Promise<any> {
    // TODO
  }

  public subscribe(request: SubscribeRequest): EventEmitter {
    // TODO
    return new EventEmitter();
  }
}

export type RpcRequest = {
  data: Bytes;
  method: string;
};

export type SubscribeRequest = {
  event: string;
  filter?: Object;
};

export function defaultProvider(): Provider {
  return new WebsocketProvider('wss://web3.oasiscloud.io/ws');
}
