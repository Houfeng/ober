/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { UNDEF } from "./ObserveConstants";

const supported = typeof Symbol !== UNDEF;
const symbolMark = "__Symbol";

export function isSymbol(value: any): value is symbol {
  return supported
    ? typeof value === "symbol"
    : (value as string)?.slice?.(0, symbolMark.length) === symbolMark;
}

export function createSymbol(description: string): symbol {
  return (
    supported ? Symbol(description) : `${symbolMark}(${description})`
  ) as symbol;
}

export const ObserveSymbols = {
  Observable: createSymbol("Observable"),
  Proxy: createSymbol("Proxy"),
  Nothing: createSymbol("Nothing"),
  DisplayName: createSymbol("DisplayName"),
  BindRequired: createSymbol("BindRequired"),
  BoundMethod: createSymbol("BoundMethod"),
};
