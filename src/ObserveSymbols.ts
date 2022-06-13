/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { UNDEF } from "./ObserveConstants";

export function isSupportSymbol() {
  return typeof Symbol !== UNDEF;
}

export function createSymbol(description: string): symbol {
  return (
    isSupportSymbol() ? Symbol(description) : `Symbol(${description})`
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
