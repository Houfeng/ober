import { IObserveEvent } from "./IObserveEvent";

export const ObserveHandlers: any = {};

export function subscribe(name: string, handler: Function) {
  if (!ObserveHandlers[name]) ObserveHandlers[name] = [];
  ObserveHandlers[name].push(handler);
}

export function unsubscribe(name: string, handler: Function) {
  if (!ObserveHandlers[name]) return;
  const index = ObserveHandlers[name].indexOf(handler);
  ObserveHandlers[name].splice(index, 1);
}

export function publish(name: string, data: IObserveEvent) {
  if (!ObserveHandlers[name]) return;
  ObserveHandlers[name].forEach((handler: Function) => handler(data));
}

(window as any).ObserveHandlers = ObserveHandlers;
