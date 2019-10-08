import { DummyStorage, bytes } from '@oasislabs/common';
import { idl, defType } from '@oasislabs/test';
import oasis from '../../src/index';
import GatewayBuilder from './gateway-builder';

const bytecode = bytes.parseHex('0x1234');

describe('Service', () => {
  it('deploys a service and executes an rpc', async () => {
    const expectedOutput = 'rpc success!';

    const gateway = new GatewayBuilder()
      .deploy('0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68')
      .rpc(expectedOutput)
      .gateway();

    oasis.setGateway(gateway);

    // Deploy the service.
    const service = await oasis.deploy('constructor-arg', {
      idl,
      bytecode: bytecode,
      db: new DummyStorage(),
      gasLimit: '0xffff',
    });

    // Invoke the Rpc.
    const result = await service.rpc.the(defType(), bytes.parseHex('1234'));

    expect(result).toEqual(expectedOutput);
  });

  it(`listens for a service event with listeners`, async () => {
    // Build the gateway with the mocked network responses.
    const gateway = new GatewayBuilder()
      .deploy('0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68')
      .subscribe({ indexed1: 1, indexed2: 1 })
      .subscribe({ indexed1: 2, indexed2: 2 })
      .subscribe({ indexed1: 3, indexed2: 3 })
      .gateway();

    oasis.setGateway(gateway);

    // Deploy the service.
    const service = await oasis.deploy('constructor-arg', {
      idl,
      bytecode: bytecode,
      db: new DummyStorage(),
      gasLimit: '0xffff',
    });

    // Three listeners listening to the same event. Each should be notified
    // separately.
    const listenerCount = 3;

    // Wait for three logs to be emitted for each listener.
    const promises: Promise<any[]>[] = [];
    for (let k = 0; k < listenerCount; k += 1) {
      promises.push(
        new Promise(resolve => {
          const logs: any[] = [];

          service.addEventListener('TestEvent2', function listener(event) {
            logs.push(event);
            if (logs.length === 3) {
              service.removeEventListener('TestEvent2', listener);
              resolve(logs);
            }
          });
        })
      );
    }

    const logListeners = await Promise.all(promises);
    // Check all the logs.
    const expected = [
      { indexed1: 1, indexed2: 1 },
      { indexed1: 2, indexed2: 2 },
      { indexed1: 3, indexed2: 3 },
    ];

    expect(logListeners.length).toEqual(listenerCount);
    logListeners.forEach(logs => {
      expect(JSON.stringify(expected)).toEqual(JSON.stringify(logs));
    });
  });
});
