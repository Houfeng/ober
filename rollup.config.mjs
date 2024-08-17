import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

function createConfig(min = false) {
  const suffix = min ? 'min.js' : 'js';
  return defineConfig({
    input: './lib/index.js',
    output: [
      {
        file: `./dist/ober.es.${suffix}`,
        format: 'esm'
      },
      {
        file: `./dist/ober.cjs.${suffix}`,
        format: 'cjs'
      },
      {
        file: `./dist/ober.umd.${suffix}`,
        format: 'umd',
        name: "Ober"
      },
      {
        file: `./dist/ober.iife.${suffix}`,
        format: 'iife',
        name: "Ober"
      }
    ],
    plugins: [
      resolve(),
      min ? terser() : void 0,
    ].filter(it => !!it),
  });
}

export default [createConfig(false), createConfig(true)]