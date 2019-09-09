import { abi } from '@oasislabs/test';
import * as coder from '../src/coder';

describe('Encoder', () => {
  it('formats sighash wiith an ethereum abi', () => {
    let format = coder.sighashFormat('Incremented', abi);
    expect(format).toEqual('Incremented(uint256)');
  });
});
