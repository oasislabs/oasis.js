import * as bytes from '../src/bytes';
import * as utils from '../src/';

describe('Utils', () => {
  it('Encodes and decodes a utf8 string', () => {
    let input = 'hello world';
    let encoded = bytes.encodeUtf8(input);
    let decoded = bytes.decodeUtf8(encoded);

    let expectedEncoded = new Uint8Array([
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
