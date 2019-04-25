import { RpcFn } from './idl';
import { H256, Bytes4, Bytes } from './types';

const cbor = require('cbor');

export interface RpcDecoder {
  decode(data: Bytes): Promise<RpcRequest>;
}

export class PlaintextRpcDecoder {
  async decode(data: Bytes): Promise<RpcRequest> {
    if (typeof data === 'string') {
      data = Buffer.from(data, 'hex');
    }

    return {
      sighash: data.slice(0, 4),
      input: cbor.decode(data.slice(4))
    };
  }
}

export class ConfidentialRpcDecoder extends PlaintextRpcDecoder {
  async decode(data: Bytes): Promise<RpcRequest> {
    // First decrypt.
    // TODO. https://github.com/oasislabs/oasis-client/issues/4

    // Now decode.
    return super.decode(data);
  }
}

type RpcRequest = {
  sighash: Bytes4;
  input: any[];
};
