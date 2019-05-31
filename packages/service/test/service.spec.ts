import { bytes, DummyStorage } from '@oasis/common';
import { nacl } from '@oasis/types';
import { idl } from '@oasis/test';
import { Idl } from '../src/idl';
import Service from '../src/service';
import { RpcRequest, setDefaultOasisGateway } from '../src/oasis-gateway';
import {
  EmptyOasisGateway,
  RpcRequestMockOasisGateway,
  ConfidentialMockOasisGateway,
  GatewayRequestDecoder,
  ConfidentialGatewayRequestDecoder
} from './utils';
import { OasisCoder } from '../src/coder/oasis';

setDefaultOasisGateway(new EmptyOasisGateway());

describe('Service', () => {
  const address = '0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68';
  it('constructs a service with a hex string address', () => {
    let service = new Service(idl, address, {
      gateway: new EmptyOasisGateway()
    });
    expect(service.address).toEqual(address);
  });

  it('constructs a service with a buffer address', () => {
    let bufferAddress = Buffer.from(address, 'hex');
    let service = new Service(idl, address, {
      gateway: new EmptyOasisGateway()
    });

    expect(service.address).toEqual(address);
  });

  it('dynamically generates rpcs for a given IDL on the service object', () => {
    // Given an idl.

    // When.
    let service = new Service(idl, address, {
      db: new DummyStorage(),
      gateway: new EmptyOasisGateway()
    });

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
    let service = new Service(idl, address, {
      db: new DummyStorage(),
      gateway: new EmptyOasisGateway()
    });

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
    let input2 = bytes.parseHex('1234');

    let txDataPromise: Promise<RpcRequest> = new Promise(async resolve => {
      // Given a service.
      let service = new Service(idl, address, {
        gateway: new RpcRequestMockOasisGateway(resolve),
        db: new DummyStorage()
      });

      // When we make an rpc request.
      await service.rpc.the(input1, input2);
    });

    let request = await txDataPromise;

    // Then we should have given the gateway the encoded wire format of the request.
    let decoder = new GatewayRequestDecoder();
    let req = await decoder.decode(request.data);
    expect(bytes.toHex(req.sighash!)).toEqual('0xccc7cde3');
    expect(JSON.stringify(req.input)).toEqual(JSON.stringify([input1, input2]));
  });

  it('encodes an rpc request for a confidential service', async () => {
    // Inputs to the rpc.
    let input1 = defType();
    let input2 = bytes.parseHex('1234');

    let serviceKeyPair = nacl.box.keyPair();

    let txDataPromise: Promise<RpcRequest> = new Promise(async resolve => {
      // Given a service.
      let service = new Service(idl, address, {
        gateway: new ConfidentialMockOasisGateway(
          resolve,
          serviceKeyPair.publicKey
        ),
        db: new DummyStorage(),
        coder: confidentialCoder(serviceKeyPair)
      });
      // When we make an rpc request.
      await service.rpc.the(input1, input2);
    });

    let request = await txDataPromise;

    // Then the receipient should be able to decrypt it.
    let decoder = new ConfidentialGatewayRequestDecoder(
      serviceKeyPair.secretKey
    );
    let plaintext = await decoder.decode(request.data);

    expect(bytes.toHex(plaintext.sighash!)).toEqual('0xccc7cde3');
    expect(JSON.stringify(plaintext.input)).toEqual(
      JSON.stringify([input1, input2])
    );
  });
});

function confidentialCoder(serviceKeyPair) {
  let keys = nacl.box.keyPair();
  let coder = OasisCoder.confidential({
    publicKey: keys.publicKey,
    privateKey: keys.secretKey,
    peerPublicKey: serviceKeyPair.publicKey,
    // @ts-ignore
    peerPrivateKey: serviceKeyPair.secretKey
  });
  // Don't bother decoding in tests since the gateway is mocked out.
  coder.decode = async (fn, data, constructor) => {
    return data;
  };
  return coder;
}

// Returns a `DefTy` object to be used for testing. See idls/test-contract.ts.
export function defType() {
  return {
    f1: 1,
    f3: {
      test: 0
    },
    f4: [
      bytes.parseHex(
        '0000000000000000000000000000000000000000000000000000000000000001'
      ),
      bytes.parseHex(
        '0000000000000000000000000000000000000000000000000000000000000002'
      ),
      bytes.parseHex('0000000000000000000000000000000000000003')
    ]
  };
}
