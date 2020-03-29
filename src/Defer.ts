export class Defer<T = any>{
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  constructor() {
    if (typeof Promise !== 'undefined') {
      this.promise = new Promise<T>((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
  }
}