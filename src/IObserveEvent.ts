import { Observer } from "./Observer";

export interface IObserveEvent {
  path: string;
  name: string;
  src: Observer;
  layer: number;
}
