import * as EventEmitter from 'eventemitter3';
import { Address, PublicKey, Bytes, PrivateKey } from '@oasislabs/types';
import { encrypt, decrypt } from '@oasislabs/confidential';
import { bytes, cbor } from '@oasislabs/common';
import {
  OasisGateway,
  RpcRequest,
  SubscribeRequest,
  UnsubscribeRequest,
  PublicKeyRequest,
  PublicKeyResponse,
  DeployRequest,
  DeployResponse,
  GetCodeRequest,
  GetCodeResponse
} from '../src/oasis-gateway';
import { RpcFn } from '../src/idl';
import { RpcRequest as FnRequest } from '../src/coder';

export class EmptyOasisGateway implements OasisGateway {
  public async rpc(request: RpcRequest): Promise<any> {}
  public subscribe(request: SubscribeRequest): EventEmitter {
    return new EventEmitter();
  }
  public unsubscribe(request: UnsubscribeRequest) {}
  public async publicKey(
    request: PublicKeyRequest
  ): Promise<PublicKeyResponse> {
    return {};
  }
  public async deploy(request: DeployRequest): Promise<DeployResponse> {
    throw new Error('cannot deploy from an empty gateway');
  }
  public async getCode(request: GetCodeRequest): Promise<GetCodeResponse> {
    return {
      code: new Uint8Array([0])
    };
  }
}

/**
 * RpcRequestMockProvider is a mock provider to pull out the request sent to a provider.
 */
export class RpcRequestMockOasisGateway extends EmptyOasisGateway {
  /**
   * @param requestResolve is a promise's resolve function returning the
   *        request received by this provider.
   */
  constructor(private requestResolve: Function) {
    super();
  }

  async rpc(request: RpcRequest): Promise<any> {
    this.requestResolve(request);
    return { output: '' };
  }
}

/**
 * Provider that deploys a contract with a fixed adress.
 */
export class DeployMockOasisGateway extends RpcRequestMockOasisGateway {
  /**
   * The address the conrtract will be deployed at.
   */
  public static address = '0x5C7b817e80680fec250a6f638c504d39AD353b26';

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    // So that we resolve the promise for the test to see this request.
    super.rpc(request);
    return {
      address: DeployMockOasisGateway.address
    };
  }
}

export class ConfidentialMockOasisGateway extends RpcRequestMockOasisGateway {
  private _publicKey: PublicKey;

  constructor(requestResolve: Function, publicKey: PublicKey) {
    super(requestResolve);
    this._publicKey = publicKey;
  }

  async publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse> {
    return { publicKey: this._publicKey };
  }
}

export class EventEmitterMockOasisGateway extends EmptyOasisGateway {
  /**
   * @param remote is this remote control for this provider. Firing an event on it will
   *        fire an event on this provider.
   */
  public constructor(private remote: EventEmitter) {
    super();
  }

  public subscribe(request: SubscribeRequest): EventEmitter {
    return this.remote;
  }
}

export class GatewayRequestDecoder {
  async decode(data: Bytes, constructor?: boolean): Promise<FnRequest> {
    if (typeof data === 'string') {
      data = bytes.parseHex(data);
    }

    return cbor.decode(data);
  }
}

export class ConfidentialGatewayRequestDecoder extends GatewayRequestDecoder {
  constructor(private privateKey: PrivateKey) {
    super();
  }

  async decode(encrypted: Bytes, constructor?: boolean): Promise<FnRequest> {
    if (constructor) {
      // Constructor rpcs aren't encrypted.
      return super.decode(encrypted, constructor);
    }
    if (typeof encrypted === 'string') {
      encrypted = bytes.parseHex(encrypted);
    }
    let decryption = await decrypt(encrypted, this.privateKey);
    return super.decode(decryption.plaintext, constructor);
  }
}
