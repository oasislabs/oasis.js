import { idl } from '@oasis/test';
import { DummyStorage } from '@oasis/common';
import { KeyStore } from '@oasis/confidential';
import { OasisCoder, Sighash } from '../src/coder/oasis';
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
        privateKey: myKeys.privateKey
      };

      // Create encoder and decoder.
      let encoder = OasisCoder.confidential(aeadKeys);
      let decoder = new ConfidentialGatewayRequestDecoder(
        serviceKeys.privateKey
      );

      // Create input.
      let rpcDefinition = {
        name: 'my_method',
        inputs: [{ type: 'bytes' }, { type: 'string' }]
      };
      let rpcInput = [new Uint8Array([1, 2, 3]), 'encrypt me!'];

      // Encode the rpc.
      let encoded = await encoder.encode(rpcDefinition, rpcInput);
      // Decode the rpc.
      let result = await decoder.decode(encoded);

      // Check it equals the original input.
      let expectedResult = {
        sighash: new Uint8Array([248, 152, 201, 10]),
        input: rpcInput
      };
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedResult));
    });
  });

  describe('Sighash', () => {
    it('formats sighash with an oasis idl', () => {
      let expected = [
        'the(list,bytes)',
        'it(map,set)',
        'void()',
        'import(RpcType)'
      ];
      for (let k = 0; k < expected.length; k += 1) {
        let fn = idl.functions[k];
        let fnSignature = Sighash.format(fn);
        expect(expected[k]).toEqual(fnSignature);
      }
    });
  });
});
