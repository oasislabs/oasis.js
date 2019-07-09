import { fromWasm } from '../src/idl';

describe('Idl', () => {
  it('Parses the idl from .wasm', () => {
    let path = 'test/wasm/mantle-counter.wasm';
    // Given.
    const bin = new Uint8Array(require('fs').readFileSync(path));

    // When.
    let idl = fromWasm(bin);
    // Then.
    let expected = expect(idl).toEqual({
      name: 'MantleCounter',
      namespace: 'mantle_counter',
      version: '0.1.0',
      constructor: { inputs: [], error: null },
      functions: [
        {
          name: 'get_count',
          mutability: 'mutable',
          output: {
            type: 'result',
            params: [{ type: 'u64' }, { type: 'string' }]
          }
        },
        {
          name: 'set_count',
          mutability: 'mutable',
          inputs: [{ name: 'c', type: { type: 'u64' } }],
          output: {
            type: 'result',
            params: [{ type: 'tuple', params: [] }, { type: 'string' }]
          }
        },
        {
          name: 'set_count2',
          mutability: 'mutable',
          inputs: [
            { name: 'c', type: { type: 'u64' } },
            { name: 'c2', type: { type: 'u64' } }
          ],
          output: {
            type: 'result',
            params: [{ type: 'tuple', params: [] }, { type: 'string' }]
          }
        },
        {
          name: 'increment_count',
          mutability: 'mutable',
          output: {
            type: 'result',
            params: [{ type: 'tuple', params: [] }, { type: 'string' }]
          }
        }
      ],
      mantle_build_version: '0.2.2'
    });
  });
});
