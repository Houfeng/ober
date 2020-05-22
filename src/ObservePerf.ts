/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";

export const ObservePerf: {
  onPublish?: (info: {
    name: string;
    data: ObserveData;
    matchOnly: boolean;
    matchedHandlers: Set<ObserveHandler>;
  }) => void;
  onSubscribe?: (info: { name: string; handler: ObserveHandler }) => void;
  onUnsubscribe?: (info: { name: string; handler: ObserveHandler }) => void;
} = {};
