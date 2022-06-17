/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { UNDEF } from "./ObserveConstants";
import { isObject } from "./ObserveUtil";

export type ObserveMode = "proxy" | "property" | "auto";

type ObserveConfigDefinition = {
  mode: ObserveMode;
  strict: boolean;
  maxListeners: number;
  logPrefix: string;
};

const DEFAULT_LOG_PREFIX = "OBER";

const ObserveENVConfig: Partial<ObserveConfigDefinition> = (() => {
  if (typeof process === UNDEF) return {};
  const OBER_CONFIG: any = process.env && process.env.OBER_CONFIG;
  if (!OBER_CONFIG) return {};
  if (isObject(OBER_CONFIG)) return OBER_CONFIG;
  try {
    return JSON.parse(OBER_CONFIG) || {};
  } catch {
    const prefix = DEFAULT_LOG_PREFIX;
    throw new Error(`"${prefix}_CONFIG" has error`);
  }
})();

export const ObserveConfig: ObserveConfigDefinition = Object.assign(
  {
    mode: "property",
    strict: false,
    maxListeners: 1024,
    logPrefix: DEFAULT_LOG_PREFIX,
  },
  ObserveENVConfig
);
