import oasis from '../../src/index';
import { Service, OasisGateway } from '@oasis/service';
import { Web3Gateway } from '@oasis/ethereum';
import { abi, bytecode } from '@oasis/test';

describe('Service', () => {
  // Increase the timeout because this is meant to be run against Devnet.
  jest.setTimeout(200000);

  let service: Service | undefined = undefined;
  let gateway: OasisGateway | undefined = undefined;

  const gateways = [
    {
      gateway: new oasis.gateways.Web3Gateway(
        'wss://web3.oasiscloud.io/ws',
        new oasis.Wallet(process.env['DEVNET_SECRET_KEY']!)
      ),
      completion: test => test.gateway.disconnect(),
      options: { gasLimit: '0xf00000' }
    },
    {
      gateway: new oasis.gateways.Gateway('http://localhost:1234'),
      completion: _test => {},
      options: undefined
    }
  ];

  gateways.forEach(test => {
    it('deploys a service', async () => {
      let coder = new oasis.utils.EthereumCoder();

      oasis.connect(test.gateway);

      service = await oasis.deploy({
        idl: abi,
        bytecode,
        arguments: [],
        header: { confidential: false },
        coder,
        gateway
      });
    });

    it('executes an rpc', async () => {
      let expectedOutput = 'rpc success!';

      let beforeCount = await service!.rpc.getCounter(test.options);
      await service!.rpc.incrementCounter(test.options);
      let afterCount = await service!.rpc.getCounter(test.options);

      expect(beforeCount.toNumber()).toEqual(0);
      expect(afterCount.toNumber()).toEqual(1);
    });

    it(`listens for service events`, async () => {
      let logs: any[] = await new Promise(async resolve => {
        let logs: any[] = [];
        service!.addEventListener('Incremented', function listener(event) {
          logs.push(event);
          if (logs.length === 3) {
            service!.removeEventListener('Incremented', listener);
            resolve(logs);
          }
        });
        for (let k = 0; k < 3; k += 1) {
          await service!.rpc.incrementCounter();
        }
      });

      for (let k = 1; k < logs.length; k += 1) {
        expect(
          logs[k].newCounter.toNumber() - logs[k - 1].newCounter.toNumber()
        ).toEqual(1);
      }

      test.completion(test);
    });
  });
});
