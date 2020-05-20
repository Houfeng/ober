/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { LoseProxy } from "./LoseProxy";
import { ObserveConfig } from "./ObserveConfig";

export const ObserveProxy = ObserveConfig.mode === "proxy" ? Proxy : LoseProxy;
