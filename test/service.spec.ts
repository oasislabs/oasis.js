import { Idl } from '../src/idl';
import Service from '../src/service';
import { PlaintextRpcDecoder } from '../src/decoder';
import { Request } from '../src/provider';
import { idl } from './idls/test-contract';
import { RequestMockProvider } from './utils';

describe('Service', () => {
  const address = '0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68';
  it('constructs a service with a hex string address', () => {
    let service = new Service(idl, address);

    expect(service.address).toEqual(address);
  });

  it('constructs a service with a buffer address', () => {
    let bufferAddress = Buffer.from(address, 'hex');
    let service = new Service(idl, address);

    expect(service.address).toEqual(address);
  });

  it('dynamically generates rpcs for a given IDL on the service object', () => {
    // Given an idl.

    // When.
    let service = new Service(idl, address);

    // Then.
    // Rpcs are directly on the service object.
    let keys = Object.keys(service);
    expect(keys.includes('the')).toBe(true);
    expect(keys.includes('it')).toBe(true);
    expect(keys.includes('void')).toBe(true);
    expect(keys.includes('import')).toBe(true);
    // Rpcs are on the intermediate rpc object.
    let rpcKeys = Object.keys(service.rpc);
    expect(rpcKeys.includes('the')).toBe(true);
    expect(rpcKeys.includes('it')).toBe(true);
    expect(rpcKeys.includes('void')).toBe(true);
    expect(rpcKeys.includes('import')).toBe(true);
  });

  it('throws an exception when the incorrect number of arguments are passed to an rpc', async () => {
    // Given.
    let service = new Service(idl, address);

    // When.
    let input = defType();
    let promise = service.rpc.the(input);

    // Then.
    return expect(promise).rejects.toEqual(
      new Error(`Invalid arguments [${JSON.stringify(input)}]`)
    );
  });

  it('encodes an rpc request using a given IDL', async () => {
    // Inputs to the rpc.
    let input1 = defType();
    let input2 = Buffer.from('1234', 'hex');

    let txDataPromise: Promise<Request> = new Promise(async resolve => {
      // Given a service.
      let service = new Service(idl, address, {
        provider: new RequestMockProvider(resolve)
      });

      // When we make an rpc request.
      await service.rpc.the(input1, input2);
    });

    let request = await txDataPromise;

    // Then we should have given the provider the encoded wire format of the request.
    let decoder = new PlaintextRpcDecoder();
    let req = await decoder.decode(request.data);
    expect(req.sighash!.toString('hex')).toEqual('ddefa4ab');
    expect(JSON.stringify(req.input)).toEqual(JSON.stringify([input1, input2]));
    expect(request.method).toEqual('oasis_rpc');
  });
});

// Returns a `DefTy` object to be used for testing. See idls/test-contract.ts.
function defType() {
  return {
    f1: 1,
    f3: {
      test: 0
    },
    f4: [
      Buffer.from(
        '0000000000000000000000000000000000000000000000000000000000000001',
        'hex'
      ),
      Buffer.from(
        '0000000000000000000000000000000000000000000000000000000000000002',
        'hex'
      ),
      Buffer.from('0000000000000000000000000000000000000003', 'hex')
    ]
  };
}