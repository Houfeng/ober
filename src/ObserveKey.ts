import { ObserveData } from "./ObserveData";

export function ObserveKey(data: ObserveData) {
  const { id, member } = data;
  return `${id}.${String(member)}`;
}
