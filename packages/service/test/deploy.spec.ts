import { cbor, bytes } from '@oasislabs/common';
import { idl } from '@oasislabs/test';
import {
  EmptyOasisGateway,
  DeployMockOasisGateway,
  GatewayRequestDecoder,
} from './utils';
import { deploy } from '../src/index';
import { RpcRequest, setGateway } from '../src/oasis-gateway';
import { DeployHeaderReader } from '../src/deploy/header';

setGateway(new EmptyOasisGateway());

describe('Service deploys', () => {
  const testCases = [
    {
      bytecode: bytes.parseHex('0x010203'),
      header: undefined,
      label: 'deploys a service with hex string bytecode',
      gasLimit: '0xffff',
    },
    {
      bytecode: bytes.parseHex('0x0102039999'),
      header: undefined,
      label: 'deploys a service with buffer bytecode',
      gasLimit: '0xffff',
    },
    {
      bytecode: bytes.parseHex('0x0102039999'),
      header: { confidential: false },
      label: 'deploys a service without confidentiality',
    },
    {
      bytecode: bytes.parseHex('0x0102039999'),
      header: { confidential: true, expiry: 12345 },
      label: 'deploys a service with expiry',
      gasLimit: '0xffff',
    },
  ];

  testCases.forEach(test => {
    it(test.label, async () => {
      // Given an idl, and deploy options.
      const deployRequestPromise: Promise<RpcRequest> = new Promise(resolve => {
        // When I deploy.
        deploy('constructor-arg', {
          idl,
          bytecode: test.bytecode,
          header: test.header,
          gateway: new DeployMockOasisGateway(resolve),
          gasLimit: test.gasLimit,
        }).then(service => {
          expect(service!.address.bytes).toEqual(
            new Uint8Array(
              bytes.parseHex(DeployMockOasisGateway.address.substr(2))
            )
          );
        });
      });

      // Await the request.
      const deployRequest = await deployRequestPromise;

      // Then it should have made a request to oasis_deploy with the correct deploy code.

      // Check the request data:
      const deployCode: Buffer = deployRequest.data as Buffer;

      // Check header.
      const header = DeployHeaderReader.header(deployCode);
      // Should have used the default header since we didn't specify one.
      const expectedHeader = { version: 1, body: { confidential: true } };
      if (test.header !== undefined) {
        expectedHeader.body = test.header!;
      }
      expect(JSON.stringify(header)).toEqual(JSON.stringify(expectedHeader));

      // Check initcode (deployCode without the header).
      const initcode = DeployHeaderReader.initcode(deployCode);
      expect(initcode.subarray(0, test.bytecode.length)).toEqual(
        new Uint8Array(test.bytecode)
      );

      // Finally check arguments.
      const encodedArgs = initcode.slice(test.bytecode.length);
      const decoder = new GatewayRequestDecoder();
      const decodedArgs = await decoder.decode(encodedArgs, true);
      expect(decodedArgs).toEqual(['constructor-arg']);
    });
  });

  it('deploys a service with multiple deploy arguments', async () => {
    const idl = {
      constructor: {
        inputs: [
          {
            type: 'string',
          },
          {
            type: 'string',
          },
        ],
      },
      functions: [],
    };

    const bytecode = bytes.parseHex('0x010203');
    const args = ['arg1', 'arg2'];

    const deployRequestPromise: Promise<RpcRequest> = new Promise(resolve => {
      // When I deploy.
      deploy(args[0], args[1], {
        idl,
        bytecode,
        gateway: new DeployMockOasisGateway(resolve),
        gasLimit: '0xfff',
      }).then(service => {
        expect(service!.address.bytes).toEqual(
          new Uint8Array(
            bytes.parseHex(DeployMockOasisGateway.address.substr(2))
          )
        );
      });
    });

    // Await the request.
    const deployRequestSerialized = await deployRequestPromise;

    // Bytecode || cbor.encode([...args])
    const initcode = DeployHeaderReader.initcode(deployRequestSerialized.data);

    // Chop off the bytecode and decode the args.
    const deployArgs = cbor.decode(initcode.slice(bytecode.length));

    expect(deployArgs).toEqual(args);
  });

  it('Throws exception when gasLimit is not given to a confidential deploy', async () => {
    const path = 'test/wasm/mantle-counter.wasm';
    const bytecode = new Uint8Array(require('fs').readFileSync(path));
    try {
      await deploy('arg1', 'arg2', {
        bytecode,
      });
      expect(true).toEqual(false);
    } catch (e) {
      expect(e.message).toEqual(
        'gasLimit must be provided for confidential deploys'
      );
    }
  });
});
