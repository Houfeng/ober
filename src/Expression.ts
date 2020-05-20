/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

const VARIABLE_FILTER = /(\(|\[|\{|\+|\-|\*|\/|\>|\<|\=|\!|\,|\;|\?|\:|\&|\|)\s*([a-z\_0-9\$]+)/gi;
const VARIABLE_NAME = /^[a-z\$\_]/i;
const ALLOWED_WORD = /^(\$scope|true|false|null|undefined|Date|Number|String|Object|Boolean|Array|RegExp|Math|JSON|parseInt|parseFloat|isNaN|isFinite)$/; // eslint-disable-line
const EXPRESSION_BLOCK = /\{\{([\s\S]+?)\}\}/;
const EXPRESSION_CACHE: { [name: string]: (socpe: any) => any } = {};
const TEMPLATE_CACHE: { [name: string]: (socpe: any) => any } = {};

export function findVariables(expr: string): string[] {
  expr = `(${expr})`;
  VARIABLE_FILTER.lastIndex = 0;
  const variables: any = {};
  let info;
  while ((info = VARIABLE_FILTER.exec(expr))) {
    // eslint-disable-line
    const name = info[2];
    if (VARIABLE_NAME.test(name) && !ALLOWED_WORD.test(name)) {
      variables[name] = true;
    }
  }
  return Object.keys(variables);
}

export function getValue(scope: any, name: string) {
  const value = scope[name];
  return value instanceof Function ? value.bind(scope) : value;
}

export function expression(expr: string) {
  const cacheItem = EXPRESSION_CACHE[expr];
  if (cacheItem) return cacheItem;
  const keys = findVariables(expr);
  // tslint:disable-next-line
  const func = new Function("$scope", ...keys, `return(${expr})`);
  const exec = (scope: any) => {
    const values = keys.map(name => getValue(scope, name));
    return func(scope, ...values);
  };
  EXPRESSION_CACHE[expr] = exec;
  return exec;
}

export function template(str: string) {
  const cacheItem = TEMPLATE_CACHE[str];
  if (cacheItem) return cacheItem;
  const blocks: (string | Function)[] = str.split(EXPRESSION_BLOCK);
  for (let i = 1; i < blocks.length; i += 2) {
    blocks[i] = expression(blocks[i] as string);
  }
  const exec = (scope: any) => {
    let result = "";
    blocks.forEach(block => {
      result += block instanceof Function ? block(scope) : block;
    });
    return result;
  };
  TEMPLATE_CACHE[str] = exec;
  return exec;
}

export function compile(str: string, mixed: boolean) {
  return mixed ? template(str) : expression(str);
}
