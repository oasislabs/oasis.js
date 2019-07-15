<img src="https://images.squarespace-cdn.com/content/5b368c164eddec44efc17fbb/1552443492143-VIVRAXWMICP0MBFR6B7Z/OasisLabs_Primary_Logo_Red_RGB.png?format=1500w&content-type=image%2Fpng"/>

-------------------------------------

# oasis.js

[![CircleCI](https://circleci.com/gh/oasislabs/oasis.js.svg?style=svg)](https://circleci.com/gh/oasislabs/oasis.js)
[![Gitter chat](https://badges.gitter.im/Oasis-official/Lobby.svg)](https://gitter.im/Oasis-official/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![docs](https://readthedocs.com/projects/oasis-labs-oasis-client/badge/?version=latest)](https://oasis-labs-oasis-client.readthedocs-hosted.com/en/latest/)

See the [documentation](https://oasis-labs-oasis-client.readthedocs-hosted.com/en/latest/)

## Packages

| Package                                                           | Version                                                                                                                        | Description                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`@oasislabs/client`](/packages/client)                           | [![npm](https://img.shields.io/npm/v/@oasislabs/client.svg)](https://www.npmjs.com/package/@oasislabs/client)                  | Client for interacting with services on the Oasis cloud            |
| [`@oasislabs/gateway-client`](/packages/developer-gateway-client) | [![npm](https://img.shields.io/npm/v/@oasislabs/gateway-client.svg)](https://www.npmjs.com/package/@oasislabs/gateway-client)  | Lightweight client for interacting with developer-gateway services |
| [`@oasislabs/gateway`](/packages/developer-gateway)               | [![npm](https://img.shields.io/npm/v/@oasislabs/gateway.svg)](https://www.npmjs.com/package/@oasislabs/gateway)                | Client backend for communicating with a developer-gateway          |
| [`@oasislabs/service`](/packages/service)                         | [![npm](https://img.shields.io/npm/v/@oasislabs/service.svg)](https://www.npmjs.com/package/@oasislabs/service)                | Implementations for deploying and interacting with services        |
| [`@oasislabs/confidential`](/packages/confidential)               | [![npm](https://img.shields.io/npm/v/@oasislabs/confidential.svg)](https://www.npmjs.com/package/@oasislabs/confidential)      | Encryption tools for confidentiality on Oasis                      |
| [`@oasislabs/common`](/packages/common)                           | [![npm](https://img.shields.io/npm/v/@oasislabs/common.svg)](https://www.npmjs.com/package/@oasislabs/common)                  | Common utilities for Oasis packages                                |
| [`@oasislabs/types`](/packages/types)                             | [![npm](https://img.shields.io/npm/v/@oasislabs/types.svg)](https://www.npmjs.com/package/@oasislabs/types)                    | Types for Oasis packages                                           |
| [`@oasislabs/test`](/packages/test)                               | [![npm](https://img.shields.io/npm/v/@oasislabs/test.svg)](https://www.npmjs.com/package/@oasislabs/test)                      | Tools used in Oasis tests                                          |


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
