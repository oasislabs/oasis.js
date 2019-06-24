import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import camelCase from 'lodash.camelcase';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import { terser } from 'rollup-plugin-terser';

const libraryName = 'index';

export default {
  input: `src/${libraryName}.ts`,
  output: [
    {
      file: 'dist/index.browser.umd.js',
      name: 'oasis',
      format: 'umd',
      sourcemap: true,
      globals: {
        crypto: 'crypto'
      },
    },
    {
      file: 'dist/index.browser.es5.js',
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
        '../../node_modules/eventemitter3/index.js': [ 'EventEmitter' ]
      }
    }),
    globals(),
    builtins(),
    json(),
    typescript({ useTsconfigDeclarationDir: true }),
    sourceMaps(),
    terser()
  ],
};