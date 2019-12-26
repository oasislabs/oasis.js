import { Balance, bytes } from '../src';

describe('bytes', () => {
  it('Encodes and decodes a utf8 string', () => {
    const input = 'hello world';
    const encoded = bytes.encodeUtf8(input);
    const decoded = bytes.decodeUtf8(encoded);

    const expectedEncoded = new Uint8Array([
      104,
      101,
      108,
      108,
      111,
      32,
      119,
      111,
      114,
      108,
      100,
    ]);
    expect(decoded).toEqual(input);
    expect(JSON.stringify(encoded)).toEqual(JSON.stringify(expectedEncoded));
  });
});

describe('balance', () => {
  it('converts from number', () => {
    const theNumber = Number.MAX_SAFE_INTEGER;
    expect(new Balance(theNumber).hex).toEqual(
      '0x' + theNumber.toString(16).padStart(32, '0')
    );
  });

  it('converts from string', () => {
    const theNumber = '123456789abcdef';
    expect(new Balance(theNumber).hex).toEqual(
      '0x' + theNumber.padStart(32, '0')
    );
  });

  it('converts from BigInt', () => {
    const theNumber = BigInt('0x123456789abcdef');
    expect(new Balance(theNumber).hex).toEqual(
      '0x' + theNumber.toString(16).padStart(32, '0')
    );
  });
});
