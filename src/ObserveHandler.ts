import { ObserveData } from "./ObserveData";

export interface ObserveHandler {
  dependencies?: Set<string>;
  (data: ObserveData): any;
}
