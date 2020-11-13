/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

export enum ObserveMode {
  proxy = "proxy",
  property = "property",
  auto = "auto"
}

export const ObserveConfig: {
  mode: ObserveMode;
  strict: boolean;
  maxDependencies: number;
  maxHandlers: number;
  logPrefix: string;
} = {
  mode: ObserveMode.auto,
  strict: false,
  maxDependencies: 1000,
  maxHandlers: 100,
  logPrefix: "OBER"
};
