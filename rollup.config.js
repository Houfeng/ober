import cleanup from 'rollup-plugin-cleanup';
import resolve from 'rollup-plugin-node-resolve';
// import { terser } from "rollup-plugin-terser";

export default {
  input: './dist/es/index.js',
  output: [
    {
      file: './dist/cjs/index.js',
      format: 'cjs'
    },
    {
      file: './dist/umd/index.js',
      format: 'umd',
      name: "ober"
    },
    {
      file: './dist/iife/index.js',
      format: 'iife',
      name: "ober"
    }
  ],
  plugins: [
    resolve(),
    //terser(),
    cleanup({
      comments: "none"
    }),
  ]
};