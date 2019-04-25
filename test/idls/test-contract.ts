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

export { idl };
