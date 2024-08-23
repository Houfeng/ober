/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

export type ConfigType = {
  env: "production" | "development";
  mode: "proxy" | "property";
  maxListeners: number;
};

const {
  OBER_MODE,
  OBER_MAX_LISTENERS,
  NODE_ENV,
  OBER_ENV = NODE_ENV,
} = typeof process !== "undefined"
  ? process.env
  : ({} as Record<string, string>);

export const ObserveConfig: ConfigType = {
  env: (OBER_ENV || "production") as ConfigType["env"],
  mode: (OBER_MODE || "proxy") as ConfigType["mode"],
  maxListeners: OBER_MAX_LISTENERS ? Number(OBER_MAX_LISTENERS) : 1024,
};

export function isDevelopment() {
  return ObserveConfig.env === "development";
}
