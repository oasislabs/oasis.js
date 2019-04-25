// TODO: https://github.com/oasislabs/oasis-client/issues/12

export interface Provider {
  send(txData: Buffer): Promise<any>;
}

export class ConfidentialProvider implements Provider {
  constructor(private provider: Provider) {}

  async send(txData: Buffer): Promise<any> {
    // TODO: https://github.com/oasislabs/oasis-client/issues/4.
    return this.provider.send(txData);
  }
}

export class WebsocketProvider {
  constructor(private url: string) {}

  async send(txData: Buffer): Promise<any> {
    // TODO
  }
}
