import { UrlEncoder } from '../src/index';

describe('UrlEncoder', () => {
  it('Encodes undefined parameters', () => {
    let encoded = UrlEncoder.encode(undefined);
    let expected = '';
    expect(encoded).toEqual(expected);
  });

  it('Encodes url parameters', () => {
    let params = {
      topics: ['0x1234', '0x9876'],
      address: '0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68'
    };
    let encoded = UrlEncoder.encode(params);
    let expected =
      'topics=0x1234%2C0x9876&address=0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68';
    expect(encoded).toEqual(expected);
  });
});
