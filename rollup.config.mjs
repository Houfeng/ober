import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser'

export default defineConfig({
  input: './lib/index.js',
  output: [
    {
      file: './dist/ober.es.js',
      format: 'esm'
    },
    {
      file: './dist/ober.cjs.js',
      format: 'cjs'
    },
    {
      file: './dist/ober.umd.js',
      format: 'umd',
      name: "Ober"
    },
    {
      file: './dist/ober.iife.js',
      format: 'iife',
      name: "Ober"
    }
  ],
  plugins: [terser]
});