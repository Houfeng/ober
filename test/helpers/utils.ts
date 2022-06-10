export const sleep = (wait: number) =>
  new Promise(resolve => setTimeout(resolve, wait));