/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";

export const ObservePerf: {
  onPublish?: (info: {
    type?: string;
    data?: ObserveData;
    matchOnly?: boolean;
    matchedHandlers?: Set<ObserveHandler>;
    commonHandlers?: Set<ObserveHandler>;
  }) => void;
  onSubscribe?: (info: { type?: string; handler?: ObserveHandler }) => void;
  onUnsubscribe?: (info: { type?: string; handler?: ObserveHandler }) => void;
} = {};
