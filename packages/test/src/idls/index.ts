import { bytes } from '@oasislabs/common';

// Returns a `DefTy` object to be used for testing. See idls/test-contract.ts.
export function defType() {
  return {
    f1: 1,
    f3: {
      test: 0,
    },
    f4: [
      bytes.parseHex(
        '0000000000000000000000000000000000000000000000000000000000000001'
      ),
      bytes.parseHex(
        '0000000000000000000000000000000000000000000000000000000000000002'
      ),
      bytes.parseHex('0000000000000000000000000000000000000003'),
    ],
  };
}
