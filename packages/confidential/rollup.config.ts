import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import camelCase from 'lodash.camelcase';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

const pkg = require('./package.json');

const libraryName = 'index';

export default {
  input: `src/${libraryName}.ts`,
  output: [
    {
      file: pkg.main,
      name: 'index',
      format: 'umd',
      sourcemap: true,
      globals: {
        crypto: 'crypto'
      },
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs({
      namedExports: {
        '../../node_modules/js-sha3/src/sha3.js': [ 'keccak256' ]
      }
    }),
    globals(),
    builtins(),
    json(),
    typescript({ useTsconfigDeclarationDir: true }),
    sourceMaps(),
  ],
};
