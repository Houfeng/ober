/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

export function createSymbol(description: string): symbol {
  return (typeof Symbol !== "undefined"
    ? Symbol(description)
    : `Symbol(${description})`) as symbol;
}

export const Symbols = {
  Observable: createSymbol("Observable"),
  IsProxy: createSymbol("IsProxy"),
  Nothing: createSymbol("Nothing")
};
