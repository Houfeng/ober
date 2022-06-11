/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveData } from "./ObserveData";
import { ObserveEventHandler } from "./ObserveEvents";

export const ObserveInspector: {
  onPublish?: (info: {
    type: string;
    data: ObserveData;
    matchOnly: boolean;
    matchedHandlers: Set<ObserveEventHandler<any>>;
    commonHandlers: Set<ObserveEventHandler<any>>;
  }) => void;
  onSubscribe?: (info: {
    type: string;
    handler: ObserveEventHandler<any>;
  }) => void;
  onUnsubscribe?: (info: {
    type: string;
    handler: ObserveEventHandler<any>;
  }) => void;
} = {};
