import Service from '../../src/service';
import { idl } from './idls/test-contract';
import { EventEmitterMockProvider } from './utils';
import * as EventEmitter from 'eventemitter3';
import { DummyStorage } from '../../src/db';

describe('Events', () => {
  const address = '0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68';
  it('Adds an event listener', async () => {
    let remote = new EventEmitter();

    let service = new Service(idl, address, {
      provider: new EventEmitterMockProvider(remote),
      db: new DummyStorage()
    });

    let eventPromise = new Promise(resolve => {
      service.addEventListener('MyEvent', event => {
        resolve(event);
      });
    });

    let expectedEvent = { MyEvent: 'This is a method' };

    remote.emit('MyEvent', expectedEvent);

    let event = await eventPromise;

    expect(event).toEqual(expectedEvent);
  });
});
