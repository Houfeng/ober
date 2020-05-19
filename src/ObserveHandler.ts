import { ObserveData } from "./ObserveData";

export interface ObserveHandler {
  dependencies?: Set<string>;
  (data: ObserveData): any;
}

export interface ObserveHandlerMap {
  [key: string]: Set<ObserveHandler>;
}

export interface ObserveHandlerStore {
  [name: string]: ObserveHandlerMap;
}
