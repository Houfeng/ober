/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

export const ObserveConfig: {
  mode: "proxy" | "property";
  maxDependencies: number;
  maxHandlers: number;
} = {
  mode: "property",
  maxDependencies: 1000,
  maxHandlers: 100
};
