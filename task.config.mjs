import { task, $ } from 'taskd';

export const lint = task('代码风格检查', async () => {
  await $`eslint -v`;
  await $`eslint --fix --ext .ts ./{src,test}/`;
});

export const clean = task('清理', async () => {
  await $`
  rm -rf ./tsconfig.tsbuildinfo
  rm -rf ./types/
  rm -rf ./dist/
  rm -rf ./build/
  rm -rf ./lib/
  `;
});

export const test = task('测试', async () => {
  const reporter = `--test-reporter=@voxpelli/node-test-pretty-reporter`;
  console.log(`------------------------- proxy -------------------------`)
  await $`OBER_MODE=proxy c8 tsx --test ${reporter} test/*.test.ts`;
  // await $`OBER_MODE=property tsx --test test/*.test.ts`;
  // await $`OBER_MODE=auto c8 tsx --test test/*.test.ts`;
});

export const build = task('构建', [clean, lint], async () => {
  await $`tsc -v`;
  await $`tsc --locale zh-CN `;
  await $`rollup -c`;
});

export const dev = task('本地开发', async () => {
  $`tsx ./debug/index.ts`;
});
