import oasis from '../../src/index';
import {
  HttpDeveloperGateway,
  Http
} from '../../src/oasis-gateway/developer-gateway/http';
import * as bytes from '../../src/utils/bytes';
import { idl } from '../unit/idls/test-contract';
import { DummyStorage } from '../../src/db';
import {
  DeveloperGatewayApi,
  DeployApi,
  PublicKeyApi,
  PollApi,
  RpcApi
} from '../../src/oasis-gateway/developer-gateway/api';

// Dummy input parameter to the rpc we want to call.
import { defType } from '../unit/service.spec';

describe('Service', () => {
  it('deploys a service and executes an rpc', async () => {
    let expectedOutput = 'rpc success!';

    let builder = new GatewayBuilder();
    // Deploy response.
    builder.addResponse({
      event: { address: '0x372FF3aeA1fc69B9C440A5fE0B4c23c38226Da68' }
    });
    // getPublicKey response.
    builder.addResponse({
      event: {}
    });
    // Rpc response.
    builder.addResponse({
      event: { output: expectedOutput }
    });
    let gateway = builder.gateway();

    // Deploy the service.
    let service = await oasis.deploy({
      idl,
      gateway,
      bytecode: '0x1234',
      db: new DummyStorage(),
      arguments: ['constructor-arg']
    });

    // Invoke the Rpc.
    let result = await service.rpc.the(defType(), bytes.parseHex('1234'));

    expect(result).toEqual(expectedOutput);
  });
});

/**
 * Builds a mock gateway with the given responses.
 */
class GatewayBuilder {
  private pollResponses: any = [];

  /**
   * The response will have a request id based upon its position in the pollResponses
   * array.
   */
  public addResponse(response: any) {
    response.event.id = this.pollResponses.length;
    this.pollResponses.push(response);
  }

  public gateway(): HttpDeveloperGateway {
    let gateway = new HttpDeveloperGateway('test');
    let http = new MockHttp(this.pollResponses);
    // @ts-ignore
    gateway.http = http;
    // @ts-ignore
    gateway.polling.http = http;
    // @ts-ignore
    gateway.polling.interval = 100;
    return gateway;
  }
}

/**
 * MockHttp mocks out the http response from the developer gateway.
 */
class MockHttp implements Http {
  // Flag for enabling/disabling logging to see what requests would be going to/from
  // the dev gateway. Useful for debugging.
  private logging = false;

  // For more organized logging.
  private loggingLine = '--------------------------------';

  private count: number = 0;

  public constructor(private pollResponses: any[]) {}

  public async post(api: string, body: any): Promise<any> {
    if (this.logging) {
      console.debug(
        `request:  ${api}\n${this.loggingLine}\n${JSON.stringify(body)}}`
      );
    }

    let response = await this._post(api, body);

    if (this.logging) {
      console.debug(
        `response: ${api}\n${this.loggingLine}\n${JSON.stringify(response)}`
      );
    }

    return response;
  }

  private async _post(api: string, body: any): Promise<any> {
    if (api === PollApi) {
      this.count += 1;
      return {
        offset: body.offset,
        events: [this.pollResponses[body.offset].event]
      };
    }
    return { id: this.count };
  }
}
