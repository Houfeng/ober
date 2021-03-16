/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { isObject } from "./Util";

export enum ObserveMode {
  proxy = "proxy",
  property = "property",
  auto = "auto"
}

export interface ObserveConfigDefinition {
  mode: ObserveMode;
  strict: boolean;
  maxDependencies: number;
  maxHandlers: number;
  logPrefix: string;
}

export const DEFAULT_LOG_PREFIX = "OBER";

export const ObserveEnvConfig: Partial<ObserveConfigDefinition> = (() => {
  if (typeof process === "undefined") return {};
  const OBER_CONFIG: any = process.env && process.env.OBER_CONFIG;
  if (!OBER_CONFIG) return {};
  if (isObject(OBER_CONFIG)) return OBER_CONFIG;
  try {
    return JSON.parse(OBER_CONFIG) || {};
  } catch {
    const prefix = DEFAULT_LOG_PREFIX;
    throw new Error(`${prefix}: "${prefix}_CONFIG" is incorrect`);
  }
})();

export const ObserveConfig: ObserveConfigDefinition = {
  mode: ObserveMode.property,
  strict: false,
  maxDependencies: 1000,
  maxHandlers: 100,
  logPrefix: DEFAULT_LOG_PREFIX,
  ...ObserveEnvConfig
};
