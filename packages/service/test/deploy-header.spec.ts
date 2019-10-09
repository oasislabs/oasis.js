import { bytes } from '@oasislabs/common';
import { DeployHeader } from '../src/deploy/header';
import { makeExpectedBytecode } from './utils';

describe('DeployHeader', () => {
  describe('deployCode', () => {
    const failTests = [
      {
        description: 'errors when writing a deploy header to empty bytecode',
        bytecode: new Uint8Array(),
        header: { expiry: 100000, confidential: false },
        error: 'Malformed deploycode',
      },
      {
        description: 'errors when writing an invalid deploy header',
        bytecode: bytes.parseHex('0x1234'),
        header: { invalid: 1234, expiry: 100000, confidential: false },
        error: 'Malformed deploycode',
      },
      {
        description:
          'errors when writing to bytecode that already has an invalid header',
        bytecode: makeExpectedBytecode(
          { expiry: 100000, confidential: false, badkey: true },
          '1234'
        ),
        header: { expiry: 100000, confidential: false },
        error:
          'Invalid body {"expiry":100000,"confidential":false,"badkey":true}',
      },
    ];

    failTests.forEach(test => {
      it(test.description, async function() {
        expect(() => {
          DeployHeader.deployCode(test.header, test.bytecode) as Uint8Array;
        }).toThrowError(test.error);
      });
    });

    const successTests = [
      {
        description: 'does not change the bytecode if the header is empty',
        bytecode: bytes.parseHex('0x1234'),
        header: {},
        expected: bytes.parseHex('0x1234'),
      },
      {
        description: 'writes a deploy header to non-empty bytecode',
        bytecode: bytes.parseHex('0x1234'),
        header: { expiry: 100000, confidential: false },
        expected: makeExpectedBytecode(
          { expiry: 100000, confidential: false },
          '1234'
        ),
      },
      {
        description:
          'overwrites a deploy header to non-empty bytecode with an existing confidential header',
        bytecode: makeExpectedBytecode({ confidential: false }, '1234'),
        header: { confidential: true },
        expected: makeExpectedBytecode({ confidential: true }, '1234'),
      },
      {
        description:
          'overwrites a deploy header to non-empty bytecode with an existing expiry header',
        bytecode: makeExpectedBytecode({ expiry: 100000 }, '1234'),
        header: { expiry: 100001 },
        expected: makeExpectedBytecode({ expiry: 100001 }, '1234'),
      },
      {
        description:
          'overwrites a deploy header to non-empty bytecode with an existing expiry and confidential header',
        bytecode: makeExpectedBytecode(
          { expiry: 100000, confidential: false },
          '1234'
        ),
        header: { expiry: 100001, confidential: true },
        expected: makeExpectedBytecode(
          { expiry: 100001, confidential: true },
          '1234'
        ),
      },
    ];

    successTests.forEach(test => {
      it(test.description, function() {
        const data = DeployHeader.deployCode(
          test.header,
          test.bytecode
        ) as Uint8Array;
        expect(data).toEqual(test.expected);
      });
    });
  });
});
