<img src="https://images.squarespace-cdn.com/content/5b368c164eddec44efc17fbb/1552443492143-VIVRAXWMICP0MBFR6B7Z/OasisLabs_Primary_Logo_Red_RGB.png?format=1500w&content-type=image%2Fpng"/>

# oasis.js

[![CircleCI](https://circleci.com/gh/oasislabs/oasis-client.svg?style=svg&circle-token=696729782cc74168d05f5fbb37d49a3e5e6065d3)](https://circleci.com/gh/oasislabs/oasis-client)
[![Coverage Status](https://coveralls.io/repos/github/oasislabs/oasis-client/badge.svg?branch=master&t=yu91jw)](https://coveralls.io/github/oasislabs/oasis-client?branch=master)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/Oasis-official/Lobby?source=orgpage)

## Contributing

### Installing

To get started:

```
yarn install
```

### Building

To build oasis.js:

```
yarn build
```

The built javascript and typescript definitions will be in `dist/`. For direct browser testing, simply include the rollup artifact directly in your script tag, e.g., `<script src=/dist/index.umd.js></script>`.

### Testing

To run all tests:

```
yarn test
```

To run tests tests both in Jest and for the browser:

```
yarn test:unit
```

or

```
yarn test:browser
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
