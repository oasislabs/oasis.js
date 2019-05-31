import * as _EventEmitter from 'eventemitter3';

let EventEmitter: any = undefined;

// Browser.
/* tslint:disable */
if (typeof window !== 'undefined') {
  // @ts-ignore
  EventEmitter = _EventEmitter.default;
}
// Node.
else {
  EventEmitter = require('eventemitter3');
}

export default EventEmitter;
