import { idl } from '@oasislabs/test';
import { DummyStorage } from '@oasislabs/common';
import { KeyStore } from '@oasislabs/confidential';
import { OasisCoder } from '../src/coder/oasis';
import { ConfidentialGatewayRequestDecoder, EmptyOasisGateway } from './utils';

describe('Encoders', () => {
  describe('ConfidentialRpcEncoder', () => {
    it('Encodes confidential transansaction', async () => {
      // Create keys.
      let keyStore = new KeyStore(new DummyStorage(), new EmptyOasisGateway());
      let myKeys = keyStore.newKeyPair();
      let serviceKeys = keyStore.newKeyPair();
      let aeadKeys = {
        peerPublicKey: serviceKeys.publicKey,
        publicKey: myKeys.publicKey,
        privateKey: myKeys.privateKey,
      };

      // Create encoder and decoder.
      let encoder = OasisCoder.confidential(aeadKeys);
      let decoder = new ConfidentialGatewayRequestDecoder(
        serviceKeys.privateKey
      );

      // Create input.
      let rpcDefinition = {
        name: 'my_method',
        inputs: [{ type: 'bytes' }, { type: 'string' }],
      };
      let rpcInput = [new Uint8Array([1, 2, 3]), 'encrypt me!'];

      // Encode the rpc.
      let encoded = await encoder.encode(rpcDefinition, rpcInput);
      // Decode the rpc.
      let result = await decoder.decode(encoded);
      // Check it equals the original input.
      let expectedResult = {
        method: 'my_method',
        payload: rpcInput,
      };
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedResult));
    });
  });
});
