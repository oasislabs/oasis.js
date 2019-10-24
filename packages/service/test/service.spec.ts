import { Address, bytes, DummyStorage } from '@oasislabs/common';
import { idl } from '@oasislabs/test';
import { Service } from '../src/service';
import { RpcRequest, setGateway } from '../src/oasis-gateway';
import {
  EmptyOasisGateway,
  RpcRequestMockOasisGateway,
  ConfidentialMockOasisGateway,
  GatewayRequestDecoder,
  ConfidentialGatewayRequestDecoder,
  aeadKeys,
} from './utils';
import { OasisCoder } from '../src/coder/oasis';
import { makeExpectedBytecode } from './utils';
import { NO_CODE_ERROR_MSG } from '../src/error';

setGateway(new EmptyOasisGateway());

describe('Service', () => {
  const address = new Address('0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68');

  it('dynamically generates rpcs for a given IDL on the service object', () => {
    // Given an idl.

    // When.
    const service = new Service(idl, address, {
      db: new DummyStorage(),
      gateway: new EmptyOasisGateway(),
    });

    // Then.
    // Rpcs are directly on the service object.
    const keys = Object.keys(service);
    expect(keys.includes('the')).toBe(true);
    expect(keys.includes('it')).toBe(true);
    expect(keys.includes('void')).toBe(true);
    expect(keys.includes('import')).toBe(true);
    // Rpcs are on the intermediate rpc object.
    const rpcKeys = Object.keys(service.rpc);
    expect(rpcKeys.includes('the')).toBe(true);
    expect(rpcKeys.includes('it')).toBe(true);
    expect(rpcKeys.includes('void')).toBe(true);
    expect(rpcKeys.includes('import')).toBe(true);
  });

  it('throws an exception when the incorrect number of arguments are passed to an rpc', async () => {
    // Given.
    const service = new Service(idl, address, {
      db: new DummyStorage(),
      gateway: new EmptyOasisGateway(),
    });

    // When.
    const input = defType();
    const promise = service.rpc.the(input);

    // Then.
    return expect(promise).rejects.toEqual(
      new Error(`Invalid arguments [${JSON.stringify(input)}]`)
    );
  });

  it('encodes an rpc request using a given IDL', async () => {
    // Inputs to the rpc.
    const input1 = defType();
    const input2 = bytes.parseHex('1234');

    const txDataPromise: Promise<RpcRequest> = new Promise(resolve => {
      // Given a service.
      const service = new Service(idl, address, {
        gateway: new RpcRequestMockOasisGateway(resolve),
        db: new DummyStorage(),
        coder: plaintextCoder(),
      });

      // When we make an rpc request.
      return service.rpc.the(input1, input2);
    });

    const request = await txDataPromise;

    // Then we should have given the gateway the encoded wire format of the request.
    const decoder = new GatewayRequestDecoder();
    const req = await decoder.decode(request.data);

    expect(req.method).toEqual('the');
    expect(JSON.stringify(req.payload)).toEqual(
      JSON.stringify([input1, input2])
    );
  });

  it('encodes an rpc request for a confidential service', async () => {
    // Inputs to the rpc.
    const input1 = defType();
    const input2 = bytes.parseHex('1234');

    const txDataPromise: Promise<RpcRequest> = new Promise(resolve => {
      // Given a service.
      const service = new Service(idl, address, {
        gateway: new ConfidentialMockOasisGateway(resolve, keys.publicKey),
        db: new DummyStorage(),
        coder: confidentialCoder(),
      });
      // When we make an rpc request.
      return service.rpc.the(input1, input2);
    });

    const request = await txDataPromise;

    // Then the receipient should be able to decrypt it.
    const decoder = new ConfidentialGatewayRequestDecoder(keys.privateKey);
    const plaintext = await decoder.decode(request.data);

    expect(plaintext.method).toEqual('the');
    expect(JSON.stringify(plaintext.payload)).toEqual(
      JSON.stringify([input1, input2])
    );
  });

  it('Service.at should accept a hex string', async () => {
    const address = '0x288e7e1cc60962f40d4d782950470e3705c5acf4';
    const bin = bytes.toHex(
      new Uint8Array(
        require('fs').readFileSync('test/wasm/mantle-counter.wasm')
      )
    );
    const gateway = {
      getCode: () => {
        return { code: makeExpectedBytecode({ confidential: false }, bin) };
      },
    };
    // @ts-ignore
    const s = await Service.at(address, {
      gateway,
      db: new DummyStorage(),
    });

    expect(s.address).toEqual(address);
  });

  it('Service.at should give an informative error when an invalid address is used', async () => {
    const address = new Address('0x288e7e1cc60962f40d4d782950470e3705c5acf4');
    const gateway = {
      // Null getCode response means the service doesn't exist at the address.
      getCode: () => {
        return { code: null };
      },
    };

    try {
      // @ts-ignore
      await Service.at(address, {
        gateway,
        db: new DummyStorage(),
      });
    } catch (e) {
      expect(e.message).toBe(NO_CODE_ERROR_MSG(address));
    }
  });
});

function confidentialCoder() {
  const coder = OasisCoder.confidential({
    publicKey: keys.peerPublicKey,
    privateKey: keys.peerPrivateKey,
    peerPublicKey: keys.publicKey,
    // @ts-ignore
    peerPrivateKey: keys.privateKey,
  });
  // Don't bother decoding in tests since the gateway is mocked out.
  coder.decode = async (fn, data, _constructor) => {
    return data;
  };
  return coder;
}

function plaintextCoder() {
  const coder = OasisCoder.plaintext();
  // Don't bother decoding in tests since the gateway is mocked out.
  coder.decode = async (fn, data, _constructor) => {
    return data;
  };
  return coder;
}

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

const keys = aeadKeys();
