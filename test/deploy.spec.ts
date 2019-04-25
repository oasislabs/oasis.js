import { Idl } from '../src/idl';
import * as oasis from '../src/index';

describe('Service deploys', () => {
  it('deploys a service', async () => {
    // Given.
    let service = new oasis.Service(idl);

    // When.
    let deployedService = await oasis.deploy(service, {
      bytecode: '0x0',
      arguments: ['constructor-arg']
    });

    // Then.
    // TODO
    expect(true).toEqual(false);
  });
});

let idl = {};
