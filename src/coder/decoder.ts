import { RpcFn } from '../idl';
import { H256, Bytes4, Bytes, PrivateKey } from '../types';
import * as bytes from '../utils/bytes';
import cbor from '../utils/cbor';
import { decrypt } from '../confidential';
import { RpcRequest } from './index';

export interface RpcDecoder {
  decode(data: Bytes, constructor?: boolean): Promise<RpcRequest>;
}

export class PlaintextRpcDecoder {
  async decode(data: Bytes, constructor?: boolean): Promise<RpcRequest> {
    if (typeof data === 'string') {
      data = bytes.parseHex(data);
    }

    // Constructor doesn't use a sighash.
    if (constructor) {
      return cbor.decode(data);
    }

    return {
      sighash: data.slice(0, 4),
      input: cbor.decode(data.slice(4))
    };
  }
}

export class ConfidentialRpcDecoder extends PlaintextRpcDecoder {
  constructor(private privateKey: PrivateKey) {
    super();
  }

  async decode(encrypted: Bytes, constructor?: boolean): Promise<RpcRequest> {
    if (constructor) {
      // Constructor rpcs aren't encrypted.
      return super.decode(encrypted);
    }
    if (typeof encrypted === 'string') {
      encrypted = bytes.parseHex(encrypted);
    }
    let decryption = await decrypt(encrypted, this.privateKey);
    return super.decode(decryption.plaintext, constructor);
  }
}
