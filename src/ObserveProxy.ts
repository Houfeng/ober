import { LoseProxy } from "./LoseProxy";
import { ObserveConfig } from "./ObserveConfig";

export const ObserveProxy = ObserveConfig.mode === "proxy" ? Proxy : LoseProxy;
