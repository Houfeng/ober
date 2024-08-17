/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

export type ObserveConfigType = {
  mode: "proxy" | "property";
  strict: boolean;
  maxListeners: number;
};

const { OBER_MODE, OBER_STRICT, OBER_MAX_LISTENERS } =
  typeof process !== "undefined" ? process.env : ({} as Record<string, string>);

export const ObserveConfig: ObserveConfigType = {
  mode: (OBER_MODE || "proxy") as ObserveConfigType["mode"],
  strict: OBER_STRICT === "true",
  maxListeners: OBER_MAX_LISTENERS ? Number(OBER_MAX_LISTENERS) : 1024,
};
