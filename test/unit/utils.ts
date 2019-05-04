import { Provider, Request } from '../../src/provider';
import * as bytes from '../../src/utils/bytes';
import { PublicKey } from '../../src/types';

/**
 * RequestMockProvider is a mock provider to pull out the request sent to a provider.
 */
export class RequestMockProvider implements Provider {
  /**
   * @param requestResolve is a promise's resolve function returning the
   *        request received by this provider.
   */
  constructor(private requestResolve: Function) {}

  async send(request: Request): Promise<any> {
    if (request.method == 'oasis_getPublicKey') {
      // Signals as a non-confidential service.
      return {};
    }
    this.requestResolve(request);
  }
}

/**
 * Provider that deploys a contract with a fixed adress.
 */
export class DeployMockProvider extends RequestMockProvider {
  /**
   * The address the conrtract will be deployed at.
   */
  public static address = '0x5C7b817e80680fec250a6f638c504d39AD353b26';

  constructor(requestResolve: Function) {
    super(requestResolve);
  }

  async send(request: Request): Promise<any> {
    super.send(request);
    return {
      address: DeployMockProvider.address
    };
  }
}

export class ConfidentialMockProvider extends RequestMockProvider {
  private publicKey: PublicKey;

  constructor(requestResolve: Function, publicKey: PublicKey) {
    super(requestResolve);
    this.publicKey = publicKey;
  }

  async send(request) {
    if (request.method === 'oasis_getPublicKey') {
      // Signals confidential.
      return { publicKey: this.publicKey };
    } else if (request.method === 'oasis_rpc') {
      super.send(request);
    }
  }
}

export class PublicKeyMockProvider implements Provider {
  public static publicKey = new Uint8Array([
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

  async send(request: Request): Promise<any> {
    if (request.method !== 'oasis_getPublicKey') {
      throw new Error(`Expected oasis_getPublicKey but go ${request}`);
    }

    let givenAddress = bytes.toHex(request.data as Uint8Array);
    if (givenAddress !== PublicKeyMockProvider.address) {
      throw new Error(
        `Unexpected data. Expected ${
          PublicKeyMockProvider.address
        } got ${givenAddress}`
      );
    }

    return {
      publicKey: PublicKeyMockProvider.publicKey
    };
  }
}

export class NoPublicKeyMockProvider implements Provider {
  async send(request: Request): Promise<any> {
    return null;
  }
}
