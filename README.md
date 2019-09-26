<img src="https://images.squarespace-cdn.com/content/5b368c164eddec44efc17fbb/1552443492143-VIVRAXWMICP0MBFR6B7Z/OasisLabs_Primary_Logo_Red_RGB.png?format=1500w&content-type=image%2Fpng"/>

-------------------------------------

[![CircleCI](https://circleci.com/gh/oasislabs/oasis.js.svg?style=svg)](https://circleci.com/gh/oasislabs/oasis.js)
[![Gitter chat](https://badges.gitter.im/Oasis-official/Lobby.svg)](https://gitter.im/Oasis-official/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![docs](https://readthedocs.com/projects/oasis-labs-oasis-client/badge/?version=latest)](https://oasis-labs-oasis-client.readthedocs-hosted.com/en/latest/)

See the [documentation](https://oasis-labs-oasis-client.readthedocs-hosted.com/en/latest/).

## Packages

### The Client

For most use cases, it's recommended to use the main `@oasislabs/client` package
for all your Oasis client needs, for which there is extensive documentation.

| Package                                                           | Version                                                                                                                        | Description                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`@oasislabs/client`](/packages/client)                           | [![npm](https://img.shields.io/npm/v/@oasislabs/client.svg)](https://www.npmjs.com/package/@oasislabs/client)                  | Client SDK for interacting with services on Oasis              |
| [`@oasislabs/react-native-client`](/packages/react-native-client)                           | [![npm](https://img.shields.io/npm/v/@oasislabs/react-native-client.svg)](https://www.npmjs.com/package/@oasislabs/react-native-client)                  | React Native Client SDK for interacting with services on Oasis              |

### Internal Packages

However, if you only need a subset of the client's features, you can take what
you need directly from the underlying packages. Together these packages compose
the client. Standalone documentation is not provided so it's recommended to use
these only if you know what you're doing.

| Package                                                           | Version                                                                                                                        | Description                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`@oasislabs/gateway`](/packages/gateway)                         | [![npm](https://img.shields.io/npm/v/@oasislabs/gateway.svg)](https://www.npmjs.com/package/@oasislabs/gateway)                | Oasis Gateway implementation used as the client backend          |
| [`@oasislabs/service`](/packages/service)                         | [![npm](https://img.shields.io/npm/v/@oasislabs/service.svg)](https://www.npmjs.com/package/@oasislabs/service)                | Connects to and deploys IDL defined services      |
| [`@oasislabs/confidential`](/packages/confidential)               | [![npm](https://img.shields.io/npm/v/@oasislabs/confidential.svg)](https://www.npmjs.com/package/@oasislabs/confidential)      | Primitives for confidentiality                    |
| [`@oasislabs/common`](/packages/common)                           | [![npm](https://img.shields.io/npm/v/@oasislabs/common.svg)](https://www.npmjs.com/package/@oasislabs/common)                  | Common utilities for Oasis packages                                |
| [`@oasislabs/test`](/packages/test)                               | [![npm](https://img.shields.io/npm/v/@oasislabs/test.svg)](https://www.npmjs.com/package/@oasislabs/test)                      | Tools used in Oasis tests                                          |
| [`@oasislabs/web3`](/packages/web3)                            | [![npm](https://img.shields.io/npm/v/@oasislabs/web3.svg)](https://www.npmjs.com/package/@oasislabs/web3)                         | Web3 JSON RPC version of an Oasis Gateway|


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

In each package, the built javascript and typescript definitions will be in `dist/`. For direct browser testing of a client, simply include the rollup artifact directly in your script tag, e.g., `<script src=/dist/index.umd.js></script>`. For example [here](https://github.com/oasislabs/oasis.js/blob/master/packages/client/test/browser/service/index.html#L3).

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
