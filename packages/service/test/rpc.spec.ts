import { RpcFactory } from '../src/rpc';
import { OasisCoder } from '../src/coder/oasis';
import { EmptySignerGateway, aeadKeys } from './utils';

describe('RpcFactory', () => {
  const address = '0x288e7e1cc60962f40d4d782950470e3705c5acf4';
  const gateway = new EmptySignerGateway();
  const coder = OasisCoder.confidential(aeadKeys());

  it('Throws exception when gasLimit is not given to a confidential rpc', async () => {
    // Given.
    const rpcDef = (() => {
      const fn = {
        name: 'myMethod',
      };
      // @ts-ignore
      return RpcFactory.buildRpc(fn, address, gateway, coder);
    })();

    try {
      // When.
      await rpcDef.rpc();
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

  it('Transforms snake_case method names to camelCase', async () => {
    // Given.
    const fn = {
      name: 'snake_case',
    };

    // When.
    // @ts-ignore
    const rpcDef = RpcFactory.buildRpc(fn, address, gateway, coder);

    // Then.
    expect(rpcDef.name).toEqual('snakeCase');
  });
});
