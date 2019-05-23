import Service from '../../src/service';
import { idl } from './idls/test-contract';
import { EventEmitterMockOasisGateway } from './utils';
import * as EventEmitter from 'eventemitter3';
import { DummyStorage } from '../../src/db';

describe('Events', () => {
  const address = '0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68';
  it('Adds an event listener', async () => {
    let remote = new EventEmitter();

    let service = new Service(idl, address, {
      gateway: new EventEmitterMockOasisGateway(remote),
      db: new DummyStorage()
    });

    let eventPromise = new Promise(resolve => {
      service.addEventListener('MyEvent', event => {
        resolve(event);
      });
    });

    // The service will decode all subscription responses from the gateway, so
    // make sure to emit the encoded version.
    remote.emit('MyEvent', {
      data:
        '7b2264617461223a223078613236383639366536343635373836353634333130313638363936653634363537383635363433323031227d',
      id: 0
    });

    let event = await eventPromise;

    // The result of decoding the above data.
    expect(event).toEqual({ indexed1: 1, indexed2: 1 });
  });
});
