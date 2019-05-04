import {
  RpcEncoder,
  ConfidentialRpcEncoder,
  PlaintextRpcEncoder
} from './encoder';
import {
  RpcDecoder,
  ConfidentialRpcDecoder,
  PlaintextRpcDecoder
} from './decoder';
import { RpcFn } from '../idl';
import { Bytes4, Bytes } from '../types';
import { AeadKeys } from '../confidential';

/**
 * RpcCoder encodes and decodes serivce rpc requests. Use the static factory methods to
 * construct an instance.
 */
export default class RpcCoder implements RpcEncoder, RpcDecoder {
  constructor(private encoder: RpcEncoder, private decoder: RpcDecoder) {}

  public async encode(fn: RpcFn, args: any[]): Promise<Uint8Array> {
    return this.encoder.encode(fn, args);
  }

  public async decode(data: Bytes, constructor?: boolean): Promise<RpcRequest> {
    return this.decoder.decode(data, constructor);
  }

  /**
   * Facotry method returning a confidential RpcCoder.
   */
  public static confidential(keys: AeadKeys): RpcCoder {
    return new RpcCoder(
      new ConfidentialRpcEncoder(keys),
      new ConfidentialRpcDecoder(keys.privateKey)
    );
  }

  /**
   * Factory method returning a non-confidential RpcCoder.
   */
  public static plaintext(): RpcCoder {
    return new RpcCoder(new PlaintextRpcEncoder(), new PlaintextRpcDecoder());
  }
}

export type RpcRequest = {
  sighash?: Bytes4;
  input: any[];
};
