import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
import commonjs from 'rollup-plugin-commonjs';

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
    commonjs(),
    typescript({ useTsconfigDeclarationDir: true }),
    sourceMaps(),
  ],
};
