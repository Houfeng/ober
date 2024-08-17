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
  await $`ENV=proxy c8 node --require ts-node/register --test test/*.test.ts`;
  await $`ENV=property c8 node --require ts-node/register --test test/*.test.ts`;
  await $`ENV=auto c8 node --require ts-node/register --test test/*.test.ts`;
});

export const build = task('构建', [clean, lint, test], async () => {
  await $`tsc -v`;
  await $`tsc --locale zh-CN `;
  await $`rollup -c`;
});

export const dev = task('本地开发', [build], async () => {
  $`ts-node --skip-project ./debug/index.ts`;
});
