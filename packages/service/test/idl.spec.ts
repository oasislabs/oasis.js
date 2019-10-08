import { fromWasm } from '../src/idl';

describe('Idl', () => {
  it('Parses the idl from .wasm', async () => {
    const path = 'test/wasm/mantle-counter.wasm';
    // Given.
    const bin = new Uint8Array(require('fs').readFileSync(path));

    // When.
    const idl = await fromWasm(bin);
    // Then.
    expect(idl).toEqual({
      name: 'MantleCounter',
      namespace: 'mantle_counter',
      version: '0.1.0',
      // eslint-disable-next-line @typescript-eslint/camelcase
      type_defs: [
        {
          type: 'event',
          name: 'Incremented',
          fields: [{ name: 'newCounter', type: { type: 'u64' } }],
        },
      ],
      constructor: { inputs: [], error: null },
      functions: [
        {
          name: 'getCounter',
          mutability: 'mutable',
          output: {
            type: 'result',
            params: [{ type: 'u64' }, { type: 'string' }],
          },
        },
        {
          name: 'setCounter',
          mutability: 'mutable',
          inputs: [{ name: 'c', type: { type: 'u64' } }],
          output: {
            type: 'result',
            params: [{ type: 'tuple', params: [] }, { type: 'string' }],
          },
        },
        {
          name: 'setCounter2',
          mutability: 'mutable',
          inputs: [
            { name: '_c', type: { type: 'u64' } },
            { name: 'c2', type: { type: 'u64' } },
          ],
          output: {
            type: 'result',
            params: [{ type: 'tuple', params: [] }, { type: 'string' }],
          },
        },
        {
          name: 'incrementCounter',
          mutability: 'mutable',
          output: {
            type: 'result',
            params: [{ type: 'tuple', params: [] }, { type: 'string' }],
          },
        },
      ],
      oasis_build_version: '0.2.0', // eslint-disable-line @typescript-eslint/camelcase
    });
  });
});
