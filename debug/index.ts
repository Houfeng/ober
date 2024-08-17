import { ObserveConfig, isObservable, observable } from "../src";
import { $Identify } from "../src/Symbols";

ObserveConfig.mode = "proxy";

@observable
class A {
  name = 'a';
  say() {
    console.log('say:', this.name);
  }
}

console.log('isObservable', isObservable(A),A[$Identify]);