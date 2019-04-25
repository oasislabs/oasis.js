import { Idl } from '../src/idl';
import * as oasis from '../src/index';
import { idl } from './idls/test-contract';
import { RequestMockProvider } from './utils';
import { Request } from '../src/provider';
import { DeployHeaderReader } from '../src/deploy/header';
import { PlaintextRpcDecoder } from '../src/decoder';

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

      let deployRequestPromise: Promise<Request> = new Promise(
        async resolve => {
          // When I deploy.
          await oasis.deploy({
            idl,
            bytecode: test.bytecode,
            arguments: args,
            header: test.header,
            provider: new RequestMockProvider(resolve)
          });
        }
      );

      // Await the request.
      let deployRequest = await deployRequestPromise;

      // Then it should have made a request to oasis_deploy with the correct deploy code.

      // 1) Check request endpoint:
      expect(deployRequest.method).toEqual('oasis_deploy');

      // 2) Check the request data:
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
