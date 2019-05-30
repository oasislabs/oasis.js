import oasis from '../../src/index';
import Service from '../../src/service';
import { EthereumGateway } from '../../src/oasis-gateway/ethereum-gateway';
import { abi, bytecode } from '../unit/idls/counter-ethereum';
import { Wallet } from 'ethers/wallet';

describe('Service', () => {
  // Increase the timeout because this is meant to be run against Devnet.
  jest.setTimeout(200000);

  let service: Service | undefined = undefined;
  let gateway: EthereumGateway | undefined = undefined;

  it('deploys a service', async () => {
    let coder = new oasis.utils.EthereumCoder();
    gateway = new oasis.utils.EthereumGateway(
      'wss://web3.oasiscloud.io/ws',
      new Wallet(process.env['DEVNET_SECRET_KEY']!)
    );
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

    let beforeCount = await service!.rpc.getCounter();
    await service!.rpc.incrementCounter();
    let afterCount = await service!.rpc.getCounter();

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

    for (let k = 0; k < logs.length; k += 1) {
      // Offset by + 2 because we increment the counter in the previous method.
      expect(logs[k].newCounter.toNumber()).toEqual(k + 2);
    }

    gateway!.disconnect();
  });
});
