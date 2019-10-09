import * as bytes from '../src/bytes';

describe('Utils', () => {
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
