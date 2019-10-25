import * as EventEmitter from 'eventemitter3';
import { PublicKey, PrivateKey, decrypt } from '@oasislabs/confidential';
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
  GetCodeResponse,
} from '../src/oasis-gateway';
import { RpcRequest as FnRequest } from '../src/coder';
import { DeployHeader, DeployHeaderWriter } from '../src/deploy/header';

export class EmptyOasisGateway implements OasisGateway {
  private connectionStateDummy = new EventEmitter();
  public async rpc(_request: RpcRequest): Promise<any> {
    return Promise.resolve();
  }
  public subscribe(_request: SubscribeRequest): EventEmitter {
    return new EventEmitter();
  }
  public unsubscribe(_request: UnsubscribeRequest) {
    return Promise.resolve();
  }
  public async publicKey(
    _request: PublicKeyRequest
  ): Promise<PublicKeyResponse> {
    return {};
  }
  public async deploy(_request: DeployRequest): Promise<DeployResponse> {
    throw new Error('cannot deploy from an empty gateway');
  }
  public async getCode(_request: GetCodeRequest): Promise<GetCodeResponse> {
    return {
      code: new Uint8Array([0]),
    };
  }
  public disconnect() {
    // no-op
  }
  public connectionState(): EventEmitter {
    return this.connectionStateDummy;
  }

  public hasSigner(): boolean {
    return false;
  }
}

export class EmptySignerGateway extends EmptyOasisGateway {
  public hasSigner(): boolean {
    return true;
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
   * The address the contract will be deployed at.
   */
  public static address = '0x5C7b817e80680fec250a6f638c504d39AD353b26';

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    // So that we resolve the promise for the test to see this request.
    super.rpc(request);
    return {
      address: bytes.parseHex(DeployMockOasisGateway.address),
    };
  }
}

export class ConfidentialMockOasisGateway extends RpcRequestMockOasisGateway {
  private _publicKey: PublicKey;

  constructor(requestResolve: Function, publicKey: PublicKey) {
    super(requestResolve);
    this._publicKey = publicKey;
  }

  async publicKey(_request: PublicKeyRequest): Promise<PublicKeyResponse> {
    return { publicKey: this._publicKey.bytes };
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

  public subscribe(_request: SubscribeRequest): EventEmitter {
    return this.remote;
  }
}

export class GatewayRequestDecoder {
  async decode(data: Uint8Array, _constructor?: boolean): Promise<FnRequest> {
    if (typeof data === 'string') {
      data = bytes.parseHex(data);
    }

    return cbor.decode(data) as FnRequest;
  }
}

export class ConfidentialGatewayRequestDecoder extends GatewayRequestDecoder {
  constructor(private privateKey: PrivateKey) {
    super();
  }

  async decode(
    encrypted: Uint8Array,
    constructor?: boolean
  ): Promise<FnRequest> {
    if (constructor) {
      // Constructor rpcs aren't encrypted.
      return super.decode(encrypted, constructor);
    }
    if (typeof encrypted === 'string') {
      encrypted = bytes.parseHex(encrypted);
    }
    const decryption = await decrypt(encrypted, this.privateKey);
    return super.decode(decryption.plaintext, constructor);
  }
}

/**
 * @returns dummy aead keys to use for testing.
 */
export function aeadKeys() {
  return {
    publicKey: new PublicKey(
      new Uint8Array([
        76,
        194,
        101,
        195,
        41,
        86,
        188,
        68,
        20,
        196,
        45,
        88,
        50,
        28,
        101,
        65,
        169,
        62,
        20,
        86,
        188,
        169,
        250,
        131,
        121,
        184,
        83,
        198,
        108,
        127,
        191,
        59,
      ])
    ),
    privateKey: new PrivateKey(
      new Uint8Array([
        77,
        65,
        100,
        57,
        158,
        249,
        115,
        170,
        228,
        223,
        8,
        122,
        34,
        16,
        7,
        109,
        121,
        80,
        221,
        98,
        147,
        57,
        33,
        10,
        117,
        181,
        183,
        181,
        119,
        248,
        6,
        97,
      ])
    ),
    peerPublicKey: new PublicKey(
      new Uint8Array([
        11,
        22,
        95,
        106,
        208,
        178,
        217,
        236,
        126,
        30,
        21,
        232,
        31,
        89,
        61,
        20,
        62,
        53,
        45,
        10,
        43,
        25,
        109,
        77,
        213,
        84,
        134,
        55,
        254,
        242,
        21,
        87,
      ])
    ),
    peerPrivateKey: new PrivateKey(
      new Uint8Array([
        102,
        213,
        202,
        145,
        129,
        99,
        154,
        30,
        39,
        120,
        107,
        223,
        154,
        170,
        91,
        51,
        180,
        126,
        147,
        208,
        28,
        232,
        221,
        65,
        142,
        189,
        187,
        37,
        158,
        134,
        218,
        171,
      ])
    ),
  };
}

export function makeExpectedBytecode(
  headerBody: any,
  bytecode: string
): Uint8Array {
  const body = DeployHeaderWriter.body(headerBody);
  const version = DeployHeaderWriter.shortToBytes(
    DeployHeader.currentVersion()
  );
  const size = DeployHeaderWriter.shortToBytes(body.length);
  return new Uint8Array(
    Buffer.concat([
      DeployHeader.prefix(),
      version,
      size,
      body,
      bytes.parseHex(bytecode),
    ])
  );
}
