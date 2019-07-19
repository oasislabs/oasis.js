import { bytes, DummyStorage } from '@oasislabs/common';
import { idl } from '@oasislabs/test';
import { Idl } from '../src/idl';
import Service from '../src/service';
import { RpcRequest, setGateway } from '../src/oasis-gateway';
import {
  EmptyOasisGateway,
  RpcRequestMockOasisGateway,
  ConfidentialMockOasisGateway,
  GatewayRequestDecoder,
  ConfidentialGatewayRequestDecoder
} from './utils';
import { OasisCoder } from '../src/coder/oasis';

setGateway(new EmptyOasisGateway());

describe('Service', () => {
  const address = '0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68';
  it('constructs a service with a hex string address', () => {
    let service = new Service(idl, address, {
      gateway: new EmptyOasisGateway()
    });
    // @ts-ignore
    expect(service._inner.address).toEqual(address);
  });

  it('constructs a service with a buffer address', () => {
    let bufferAddress = Buffer.from(address, 'hex');
    let service = new Service(idl, address, {
      gateway: new EmptyOasisGateway()
    });

    // @ts-ignore
    expect(service._inner.address).toEqual(address);
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
        db: new DummyStorage(),
        coder: plaintextCoder()
      });

      // When we make an rpc request.
      await service.rpc.the(input1, input2);
    });

    let request = await txDataPromise;

    // Then we should have given the gateway the encoded wire format of the request.
    let decoder = new GatewayRequestDecoder();
    let req = await decoder.decode(request.data);

    expect(req.method).toEqual('the');
    expect(JSON.stringify(req.payload)).toEqual(
      JSON.stringify([input1, input2])
    );
  });

  it('encodes an rpc request for a confidential service', async () => {
    // Inputs to the rpc.
    let input1 = defType();
    let input2 = bytes.parseHex('1234');

    let txDataPromise: Promise<RpcRequest> = new Promise(async resolve => {
      // Given a service.
      let service = new Service(idl, address, {
        gateway: new ConfidentialMockOasisGateway(resolve, keys.publicKey),
        db: new DummyStorage(),
        coder: confidentialCoder()
      });
      // When we make an rpc request.
      await service.rpc.the(input1, input2);
    });

    let request = await txDataPromise;

    // Then the receipient should be able to decrypt it.
    let decoder = new ConfidentialGatewayRequestDecoder(keys.privateKey);
    let plaintext = await decoder.decode(request.data);

    expect(plaintext.method).toEqual('the');
    expect(JSON.stringify(plaintext.payload)).toEqual(
      JSON.stringify([input1, input2])
    );
  });
});

function confidentialCoder() {
  let coder = OasisCoder.confidential({
    publicKey: keys.peerPublicKey,
    privateKey: keys.peerPrivateKey,
    peerPublicKey: keys.publicKey,
    // @ts-ignore
    peerPrivateKey: keys.privateKey
  });
  // Don't bother decoding in tests since the gateway is mocked out.
  coder.decode = async (fn, data, constructor) => {
    return data;
  };
  return coder;
}

function plaintextCoder() {
  let coder = OasisCoder.plaintext();
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

const keys = {
  publicKey: new Uint8Array([
    76,
    194,
    101,
    195,
    41,
    86,
    188,
    68,
    20,
    196,
    45,
    88,
    50,
    28,
    101,
    65,
    169,
    62,
    20,
    86,
    188,
    169,
    250,
    131,
    121,
    184,
    83,
    198,
    108,
    127,
    191,
    59
  ]),
  privateKey: new Uint8Array([
    77,
    65,
    100,
    57,
    158,
    249,
    115,
    170,
    228,
    223,
    8,
    122,
    34,
    16,
    7,
    109,
    121,
    80,
    221,
    98,
    147,
    57,
    33,
    10,
    117,
    181,
    183,
    181,
    119,
    248,
    6,
    97
  ]),
  peerPublicKey: new Uint8Array([
    11,
    22,
    95,
    106,
    208,
    178,
    217,
    236,
    126,
    30,
    21,
    232,
    31,
    89,
    61,
    20,
    62,
    53,
    45,
    10,
    43,
    25,
    109,
    77,
    213,
    84,
    134,
    55,
    254,
    242,
    21,
    87
  ]),
  peerPrivateKey: new Uint8Array([
    102,
    213,
    202,
    145,
    129,
    99,
    154,
    30,
    39,
    120,
    107,
    223,
    154,
    170,
    91,
    51,
    180,
    126,
    147,
    208,
    28,
    232,
    221,
    65,
    142,
    189,
    187,
    37,
    158,
    134,
    218,
    171
  ])
};
