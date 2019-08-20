import { RpcFactory } from '../src/rpc';
import { OasisCoder } from '../src/coder/oasis';
import { EmptySignerGateway, aeadKeys } from './utils';

describe('RpcFactory', () => {
  it('Throws exception when gasLimit is not given to a confidential rpc', async () => {
    // Given.
    let rpc = (() => {
      let fn = {
        name: 'myMethod'
      };
      let address = '0x288e7e1cc60962f40d4d782950470e3705c5acf4';
      let gateway = new EmptySignerGateway();
      let coder = OasisCoder.confidential(aeadKeys());
      // @ts-ignore
      return RpcFactory.buildRpc(fn, address, gateway, coder);
    })();

    try {
      // When.
      await rpc();
      // Fail.
      expect(true).toBe(false);
    } catch (e) {
      // Then.
      expect(e.message).toBe(
        'gasLimit must be specified when signing a transaction to a confidential service'
      );
      // Success.
    }
  });
});
