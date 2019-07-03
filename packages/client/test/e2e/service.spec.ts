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
        'ws://localhost:8555',
        new oasis.Wallet.fromMnemonic(
          'patient oppose cotton portion chair gentle jelly dice supply salmon blast priority'
        )
      ),
      completion: test => test.gateway.disconnect(),
      options: { gasLimit: '0xe79732' }
    }
  ];

  gateways.forEach(test => {
    /*
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
	*/

    //let deployedAddress = undefined;

    it('deploys a service', async () => {
      oasis.connect(test.gateway);

      let idl = {
        name: 'MantleCounter',
        namespace: 'mantle_counter',
        constructor: {
          inputs: []
        },
        functions: [
          {
            name: 'get_count',
            mutability: 'mutable',
            inputs: [],
            output: {
              type: 'u64'
            }
          },
          {
            name: 'get_count2',
            mutability: 'mutable',
            inputs: [
              {
                type: 'u64'
              },
              {
                type: 'string'
              }
            ],
            output: {
              type: 'u64'
            }
          },
          {
            name: 'increment_count',
            mutability: 'mutable',
            inputs: []
          }
        ],
        mantle_build_version: '0.2.0'
      };

      let bytecode = new Uint8Array(
        require('fs').readFileSync(
          '/code/runtime-ethereum/tests/contracts/mantle-counter/target/service/mantle-counter.wasm'
        )
      );

      service = await oasis.deploy({
        idl,
        bytecode,
        arguments: [],
        header: { confidential: false }
      });
    });

    /*
	it('attaches to a service with an address only', async () => {

	  //console.log('deployued = ', oasis.utils.bytes.toHex(deployedAddress));
	  //let service = await oasis.Service.at(deployedAddress);
	  console.log('service = ', service);

      let beforeCount = await service!.rpc.getCounter(test.options);
      await service!.rpc.incrementCounter(test.options);
      let afterCount = await service!.rpc.getCounter(test.options);

      expect(beforeCount.toNumber()).toEqual(0);
      expect(afterCount.toNumber()).toEqual(1);	  
	});
	*/

    it('executes an rpc', async () => {
      let expectedOutput = 'rpc success!';

      let beforeCount = await service!.rpc.get_count(test.options);
      console.log('before = ', beforeCount);
      await service!.rpc.increment_count(test.options);
      let afterCount = await service!.rpc.get_count(test.options);

      console.log('after = ', afterCount);
      /*

	  */
      expect(beforeCount.toNumber()).toEqual(0);
      test.completion(test);
      //expect(afterCount.toNumber()).toEqual(1);
    });

    /*
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
	*/
  });
});
