import {
  OasisGateway,
  RpcRequest,
  SubscribeRequest,
  PublicKeyRequest,
  PublicKeyResponse,
  DeployRequest,
  DeployResponse
} from '../../src/oasis-gateway';
import * as bytes from '../../src/utils/bytes';
import { Address, PublicKey } from '../../src/types';
import * as EventEmitter from 'eventemitter3';

export class EmptyOasisGateway implements OasisGateway {
  public async rpc(request: RpcRequest): Promise<any> {}
  public subscribe(request: SubscribeRequest): EventEmitter {
    return new EventEmitter();
  }
  public async publicKey(
    request: PublicKeyRequest
  ): Promise<PublicKeyResponse> {
    return {};
  }
  public async deploy(request: DeployRequest): Promise<DeployResponse> {
    throw new Error('cannot deploy from an empty gateway');
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

export class PublicKeyMockProvider extends EmptyOasisGateway {
  public static _publicKey = new Uint8Array([
    212,
    68,
    31,
    146,
    81,
    149,
    55,
    148,
    122,
    149,
    152,
    112,
    75,
    10,
    165,
    224,
    0,
    223,
    142,
    70,
    148,
    92,
    150,
    1,
    245,
    166,
    152,
    125,
    32,
    138,
    118,
    115
  ]);

  public static address = '0x5c7b817e80680fec250a6f638c504d39ad353b26';

  async rpc(request: RpcRequest): Promise<any> {
    throw new Error(`Expected oasis_getPublicKey but got ${request}`);
  }

  async publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse> {
    let givenAddress = bytes.toHex(request.address as Uint8Array);
    if (givenAddress !== PublicKeyMockProvider.address) {
      throw new Error(
        `Unexpected data. Expected ${
          PublicKeyMockProvider.address
        } got ${givenAddress}`
      );
    }

    return { publicKey: PublicKeyMockProvider._publicKey };
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
