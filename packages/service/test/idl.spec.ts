import { fromWasm } from '../src/idl';

describe('Idl', () => {
  it('Parses the idl from .wasm', () => {
    // Given.
    const bin = new Uint8Array(
      require('fs').readFileSync('test/wasm/mantle-counter.wasm')
    );
    // When.
    let idl = fromWasm(bin);
    // Then.
    let expected = expect(idl).toEqual({
      name: 'MantleCounter',
      namespace: 'mantle_counter',
      constructor: { inputs: [] },
      functions: [
        { name: 'increment_count', mutability: 'mutable' },
        { name: 'get_count', mutability: 'mutable', output: { type: 'u64' } }
      ],
      mantle_build_version: '0.2.1'
    });
  });
});
