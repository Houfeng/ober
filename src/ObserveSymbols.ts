/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { SMBL, SUPT_SMBL } from "./ObserveConstants";

function createSymbol(description: string): symbol {
  return (
    SUPT_SMBL ? Symbol(description) : `${SMBL}(${description})`
  ) as symbol;
}

export const ObserveSymbols = {
  Observable: createSymbol("Observable"),
  Proxy: createSymbol("Proxy"),
  Nothing: createSymbol("Nothing"),
  BindRequired: createSymbol("BindRequired"),
  BoundMethod: createSymbol("BoundMethod"),
};
