export function isString(value: any) {
  return typeof value === "string";
}

export function isNumber(value: any) {
  return typeof value === "number";
}

export function isObject(value: any) {
  return typeof value === "object";
}

export function isArray(value: any) {
  return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

export function isFunction(value: any) {
  return typeof value === "function";
}

export function isUndefined(value: any) {
  return value === undefined;
}

export function isNull(value: any) {
  return value === null;
}

export function isNullOrUndefined(value: any) {
  return isNull(value) || isUndefined(value);
}

export function isSymbol(value: any) {
  return (
    typeof value === "symbol" ||
    (isString(value) && /^Symbol\([\s\S]+\)$/.test(value))
  );
}

export function isPrivateKey(value: any) {
  return (
    isString(value) && [/^\_(.*)\_$/, /^\_\_/].some(expr => expr.test(value))
  );
}

export function defineMember(target: any, member: string | symbol, value: any) {
  Object.defineProperty(target, member, {
    configurable: true,
    enumerable: false,
    value
  });
}

export function throwError(err: Error) {
  throw err;
}
