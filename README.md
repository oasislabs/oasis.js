<img src="https://images.squarespace-cdn.com/content/5b368c164eddec44efc17fbb/1552443492143-VIVRAXWMICP0MBFR6B7Z/OasisLabs_Primary_Logo_Red_RGB.png?format=1500w&content-type=image%2Fpng"/>

-------------------------------------

# oasis.js

[![CircleCI](https://circleci.com/gh/oasislabs/oasis-client.svg?style=svg&circle-token=696729782cc74168d05f5fbb37d49a3e5e6065d3)](https://circleci.com/gh/oasislabs/oasis-client)
[![Coverage Status](https://coveralls.io/repos/github/oasislabs/oasis-client/badge.svg?branch=master&t=yu91jw)](https://coveralls.io/github/oasislabs/oasis-client?branch=master)
[![Gitter chat](https://badges.gitter.im/Oasis-official/Lobby.svg)](https://gitter.im/Oasis-official/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
![docs](https://readthedocs.com/projects/oasis-labs-oasis-client/badge/?version=latest)

## Packages

| Package                                                           | Version                                                                                                                   | Description                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`client`](/packages/client)                                      | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Client for interacting with services on the Oasis cloud            |
| [`developer-gateway-client`](/packages/developer-gateway-client)  | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Lightweight client for interacting with developer-gateway services |
| [`@oasis/developer-gateway`](/packages/developer-gateway)         | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Client backend for communicating with a developer-gateway          |
| [`@oasis/service`](/packages/service)                             | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Implementations for deploying and interacting with services        |
| [`@oasis/confidential`](/packages/confidential)                   | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Encryption tools for confidentiality on Oasis                      |
| [`@oasis/common`](/packages/common)                               | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Common utilities for Oasis packages                                |
| [`@oasis/types`](/packages/types)                                 | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Types for Oasis packages                                           |
| [`@oasis/test`](/packages/test)                                   | [![npm](https://img.shields.io/npm/v/client.svg)](https://www.npmjs.com)                                                  | Tools used in Oasis tests                                          |


## Contributing

### Installing

To get started first install the required build tools:

```
npm install -g lerna
npm install -g yarn
```

Then bootstrap the workspace:

```
yarn
```

### Building

To build the workspace:

```
yarn build
```

In each package, the built javascript and typescript definitions will be in `dist/`. For direct browser testing of a client, simply include the rollup artifact directly in your script tag, e.g., `<script src=/dist/index.umd.js></script>`. For example [here](https://github.com/oasislabs/oasis-client/blob/armani/wallet/packages/client/test/browser/service/index.html#L3).

### Testing

To run all tests:

```
yarn test
```

### Linting

To lint:

```
yarn lint
```


To apply lint fixes:

```
yarn lint:fix
```
