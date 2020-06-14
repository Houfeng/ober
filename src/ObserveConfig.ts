/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

export const ObserveConfig: {
  mode: "proxy" | "property";
  strict: boolean;
  maxDependencies: number;
  maxHandlers: number;
} = {
  mode: "property",
  strict: false,
  maxDependencies: 1000,
  maxHandlers: 100
};
