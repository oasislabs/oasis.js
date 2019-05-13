import { Idl } from '../../src/idl';
import oasis from '../../src/index';
import { DeployMockOasisGateway } from './utils';
import { RpcRequest } from '../../src/oasis-gateway';
import { DeployHeaderReader } from '../../src/deploy/header';
import { PlaintextRpcDecoder } from '../../src/coder/decoder';
import { idl } from './idls/test-contract';
import Service from '../../src/service';

describe('Service deploys', () => {
  let testCases = [
    {
      bytecode: '0x010203',
      header: undefined,
      label: 'deploys a service with hex string bytecode'
    },
    {
      bytecode: Buffer.from('0102039999', 'hex'),
      header: undefined,
      label: 'deploys a service with buffer bytecode'
    },
    {
      bytecode: Buffer.from('0102039999', 'hex'),
      header: { confidential: false },
      label: 'deploys a service without confidentiality'
    },
    {
      bytecode: Buffer.from('0102039999', 'hex'),
      header: { confidential: true, expiry: 12345 },
      label: 'deploys a service with expiry'
    }
  ];

  testCases.forEach(test => {
    it(test.label, async () => {
      // Given an idl, and deploy options.
      let args = ['constructor-arg'];
      let service: Service | undefined = undefined;
      let deployRequestPromise: Promise<RpcRequest> = new Promise(
        async resolve => {
          // When I deploy.
          service = await oasis.deploy({
            idl,
            bytecode: test.bytecode,
            arguments: args,
            header: test.header,
            provider: new DeployMockOasisGateway(resolve)
          });
          expect(service!.address).toEqual(DeployMockOasisGateway.address);
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
      // Ensure it's a hex string before comparing.
      if (typeof test.bytecode !== 'string') {
        test.bytecode = '0x' + (test.bytecode as Buffer).toString('hex');
      }
      expect(initcode.startsWith(test.bytecode)).toEqual(true);

      // Finally check arguments.
      let encodedArgs = initcode.slice(test.bytecode.length);
      let decoder = new PlaintextRpcDecoder();
      let decodedArgs = await decoder.decode(encodedArgs, true);
      expect(decodedArgs).toEqual(args);
    });
  });
});
