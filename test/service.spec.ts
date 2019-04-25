import { Idl } from '../src/idl';
import Service from '../src/service';

describe('Service', () => {
  it('generates rpcs for a given IDL', () => {
    // Given an idl.

    // When.
    let service = new Service(idl);

    // Then.
    let rpcs = Object.keys(service.rpc);

    rpcs.includes('the');
    rpcs.includes('it');
    rpcs.includes('void');
    rpcs.includes('import');
  });

  it('throws an exception when an invalid IDL is given to the Service constructor', () => {
    // todo
    expect(true).toEqual(false);
  });

  it('generates event emitters for a given IDL', () => {
    // Given an idl.

    // When.
    let service = new Service(idl);

    // Then.
    let events = Object.keys(service.events);

    // todo
    expect(true).toEqual(false);
  });

  it('throws an exception when the incorrect number of arguments are passed to an rpc', async () => {
    // Given.
    let service = new Service(idl);

    // When.
    let input = defType();
    let promise = service.rpc.the(input);

    // Then.
    return expect(promise).rejects.toEqual(
      new Error(`Invalid arguments [${JSON.stringify(input)}]`)
    );
  });

  it('throws an exception when the incorrect type is given to an rpc', async () => {
    // Given.
    let service = new Service(idl);

    // When.
    let input1 = defType();
    let input2 = 'hi';
    let promise = service.rpc.the(input1, input2);

    // Then.
    return expect(promise).rejects.toEqual(
      new Error(`Invalid arguments ${JSON.stringify([input1, input2])}`)
    );
  });

  it('makes an rpc request using a given IDL', async () => {
    let service = new Service(idl);
    await service.rpc.the();

    // todo
    expect(true).toEqual(false);
  });

  it('subscribes to logs using a given IDL', () => {
    let service = new Service(idl);

    service.events.MyEvent.on('data', (data: string) => {
      // do something
    }).on('error', (err: string) => {
      // do something
    });

    // todo
    expect(true).toEqual(false);
  });
});

// Returns a `DefTy` object to be used for testing.
function defType() {
  return {
    f1: 1,
    f3: {
      test: 0
    },
    f4: [
      Buffer.from(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        'hex'
      ),
      Buffer.from(
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        'hex'
      ),
      Buffer.from('0x0000000000000000000000000000000000000003', 'hex')
    ]
  };
}

const idl = {
  name: 'TestContract',
  namespace: 'test_idl_gen',
  imports: [
    {
      name: 'testlib',
      version: '0.1.0'
    }
  ],
  type_defs: [
    {
      type: 'enum',
      name: 'InnerTy',
      variants: ['Field1', 'Field2']
    },
    {
      type: 'struct',
      name: 'DefTy',
      fields: [
        {
          name: 'f1',
          type: {
            optional: 'i64'
          }
        },
        {
          name: 'f2',
          type: {
            list: {
              optional: {
                defined: {
                  type: 'DefTy'
                }
              }
            }
          }
        },
        {
          name: 'f3',
          type: {
            map: [
              'string',
              {
                defined: {
                  type: 'InnerTy'
                }
              }
            ]
          }
        },
        {
          name: 'f4',
          type: {
            tuple: ['h256', 'u256', 'address']
          }
        }
      ]
    }
  ],
  constructor: {
    inputs: ['string']
  },
  functions: [
    {
      name: 'the',
      mutability: 'immutable',
      inputs: [
        {
          list: {
            defined: {
              type: 'DefTy'
            }
          }
        },
        'bytes'
      ],
      output: {
        set: 'address'
      }
    },
    {
      name: 'it',
      mutability: 'mutable',
      inputs: [
        {
          map: [
            'bool',
            {
              array: ['u32', 12]
            }
          ]
        },
        {
          set: 'i64'
        }
      ]
    },
    {
      name: 'void',
      mutability: 'immutable',
      inputs: []
    },
    {
      name: 'import',
      mutability: 'mutable',
      inputs: [
        {
          defined: {
            namespace: 'testlib',
            type: 'RpcType'
          }
        }
      ],
      output: {
        tuple: ['bool', 'i8']
      }
    }
  ],
  idl_gen_version: '0.1.0'
};
