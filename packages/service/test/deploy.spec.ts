import { cbor, bytes } from '@oasislabs/common';
import { idl } from '@oasislabs/test';
import {
  EmptyOasisGateway,
  DeployMockOasisGateway,
  GatewayRequestDecoder,
} from './utils';
import { Idl } from '../src/idl';
import { deploy, Service } from '../src/index';
import { RpcRequest, setGateway } from '../src/oasis-gateway';
import { DeployHeaderReader } from '../src/deploy/header';

setGateway(new EmptyOasisGateway());

describe('Service deploys', () => {
  let testCases = [
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
      let service: Service | undefined = undefined;
      let deployRequestPromise: Promise<RpcRequest> = new Promise(
        async resolve => {
          // When I deploy.
          service = await deploy('constructor-arg', {
            idl,
            bytecode: test.bytecode,
            header: test.header,
            gateway: new DeployMockOasisGateway(resolve),
            gasLimit: test.gasLimit,
          });
          // @ts-ignore
          expect(service!._inner.address).toEqual(
            new Uint8Array(
              bytes.parseHex(DeployMockOasisGateway.address.substr(2))
            )
          );
        }
      );

      // Await the request.
      let deployRequest = await deployRequestPromise;

      // Then it should have made a request to oasis_deploy with the correct deploy code.

      // Check the request data:
      let deployCode: Buffer = deployRequest.data as Buffer;

      // Check header.
      let header = DeployHeaderReader.header(deployCode);
      // Should have used the default header since we didn't specify one.
      let expectedHeader = { version: 1, body: { confidential: true } };
      if (test.header !== undefined) {
        expectedHeader.body = test.header!;
      }
      expect(JSON.stringify(header)).toEqual(JSON.stringify(expectedHeader));

      // Check initcode (deployCode without the header).
      let initcode = DeployHeaderReader.initcode(deployCode);
      expect(initcode.subarray(0, test.bytecode.length)).toEqual(
        new Uint8Array(test.bytecode)
      );

      // Finally check arguments.
      let encodedArgs = initcode.slice(test.bytecode.length);
      let decoder = new GatewayRequestDecoder();
      let decodedArgs = await decoder.decode(encodedArgs, true);
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

    let deployRequestPromise: Promise<RpcRequest> = new Promise(
      async resolve => {
        // When I deploy.
        const service = await deploy(args[0], args[1], {
          idl,
          bytecode,
          gateway: new DeployMockOasisGateway(resolve),
          gasLimit: '0xfff',
        });
        // @ts-ignore
        expect(service!._inner.address).toEqual(
          new Uint8Array(
            bytes.parseHex(DeployMockOasisGateway.address.substr(2))
          )
        );
      }
    );

    // Await the request.
    const deployRequestSerialized = await deployRequestPromise;

    // Bytecode || cbor.encode([...args])
    const initcode = DeployHeaderReader.initcode(deployRequestSerialized.data);

    // Chop off the bytecode and decode the args.
    const deployArgs = cbor.decode(initcode.slice(bytecode.length));

    expect(deployArgs).toEqual(args);
  });

  it('Throws exception when gasLimit is not given to a confidential deploy', async () => {
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

    try {
      const service = await deploy(args[0], args[1], {
        idl,
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
