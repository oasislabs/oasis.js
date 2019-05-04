import { ConfidentialRpcEncoder } from '../../src/coder/encoder';
import { ConfidentialRpcDecoder } from '../../src/coder/decoder';
import KeyStore from '../../src/confidential/key-store';
import { DummyStorage } from '../../src/db';

describe('Encoders', () => {
  describe('ConfidentialRpcEncoder', () => {
    it('Encodes and decodes a confidential transansaction', async () => {
      // Create keys.
      let keyStore = new KeyStore(new DummyStorage());
      let myKeys = keyStore.newKeyPair();
      let serviceKeys = keyStore.newKeyPair();
      let aeadKeys = {
        peerPublicKey: serviceKeys.publicKey,
        publicKey: myKeys.publicKey,
        privateKey: myKeys.privateKey
      };

      // Create encoder and decoder.
      let encoder = new ConfidentialRpcEncoder(aeadKeys);
      let decoder = new ConfidentialRpcDecoder(serviceKeys.privateKey);

      // Create input.
      let rpcDefinition = {
        name: 'my_method',
        inputs: ['bytes', 'string']
      };
      let rpcInput = [new Uint8Array([1, 2, 3]), 'encrypt me!'];

      // Encode the rpc.
      let encoded = await encoder.encode(rpcDefinition, rpcInput);
      // Decode the rpc.
      let result = await decoder.decode(encoded);

      // Check it equals the original input.
      let expectedResult = {
        sighash: new Uint8Array([216, 126, 223, 139]),
        input: rpcInput
      };
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedResult));
    });
  });
});
