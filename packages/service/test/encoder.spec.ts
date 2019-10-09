import { DummyStorage } from '@oasislabs/common';
import { KeyStore } from '@oasislabs/confidential';
import { OasisCoder } from '../src/coder/oasis';
import { ConfidentialGatewayRequestDecoder, EmptyOasisGateway } from './utils';

describe('Encoders', () => {
  describe('ConfidentialRpcEncoder', () => {
    it('Encodes confidential transansaction', async () => {
      // Create keys.
      const keyStore = new KeyStore(
        new DummyStorage(),
        new EmptyOasisGateway()
      );
      const myKeys = keyStore.newKeyPair();
      const serviceKeys = keyStore.newKeyPair();
      const aeadKeys = {
        peerPublicKey: serviceKeys.publicKey,
        publicKey: myKeys.publicKey,
        privateKey: myKeys.privateKey,
      };

      // Create encoder and decoder.
      const encoder = OasisCoder.confidential(aeadKeys);
      const decoder = new ConfidentialGatewayRequestDecoder(
        serviceKeys.privateKey
      );

      // Create input.
      const rpcDefinition = {
        name: 'my_method',
        inputs: [{ type: 'bytes' }, { type: 'string' }],
      };
      const rpcInput = [new Uint8Array([1, 2, 3]), 'encrypt me!'];

      // Encode the rpc.
      const encoded = await encoder.encode(rpcDefinition, rpcInput);
      // Decode the rpc.
      const result = await decoder.decode(encoded);
      // Check it equals the original input.
      const expectedResult = {
        method: 'my_method',
        payload: rpcInput,
      };
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedResult));
    });
  });
});
