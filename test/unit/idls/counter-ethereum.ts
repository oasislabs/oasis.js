export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'newCounter',
        type: 'uint256'
      }
    ],
    name: 'Incremented',
    type: 'event'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'verifyCounterValue',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getCounter',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'incrementCounter',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'incrementAndGetCounter',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'count',
        type: 'uint256'
      }
    ],
    name: 'incrementCounterManyTimes',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
];
