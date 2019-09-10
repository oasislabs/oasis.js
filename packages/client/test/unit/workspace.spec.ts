import { ServiceDefinition } from '../../src/workspace';

describe('ServiceDefinition', () => {
  describe('injectBytecode', () => {
    const bytecode = new Uint8Array([1, 2, 3]);
    const idl = {
      constructor: {
        inputs: [{ type: 'string' }],
      },
    };
    const serviceDef = new ServiceDefinition(bytecode, idl);

    it('injects bytecode into the deploy options', async () => {
      const deployOptions = { gasLimit: '0x00' };
      const args = ['hello', deployOptions];

      // @ts-ignore
      serviceDef.injectBytecode(args);

      const expectedArgs = [
        'hello',
        {
          ...deployOptions,
          bytecode,
        },
      ];

      // Bytecode should be properly injected.
      expect(args).toEqual(expectedArgs);
      // Original options should not have been mutated.
      expect(deployOptions).toEqual({ gasLimit: '0x00' });
    });

    it('creates deploy options when none exist', async () => {
      const args = ['hello'];

      // @ts-ignore
      serviceDef.injectBytecode(args);

      const expectedArgs = [
        'hello',
        {
          bytecode,
        },
      ];

      expect(args).toEqual(expectedArgs);
    });

    it('errors if bytecode is provided', async () => {
      const args = [
        'hello',
        {
          bytecode: new Uint8Array([1, 2, 3]),
        },
      ];

      try {
        // @ts-ignore
        serviceDef.injectBytecode(args);
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toEqual(
          'Bytecode should not be provided when deploying a workspace service'
        );
      }
    });
  });
});
