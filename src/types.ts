import { EventEmitter } from 'events';

export interface Rpcs {
  [key: string]: Rpc;
}

export type Rpc = (...args: any[]) => Promise<any>;

export interface Events {
  [key: string]: EventEmitter;
}

//export type H256 = ;
