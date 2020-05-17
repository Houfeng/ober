export function createSymbol(description: string) {
  return typeof Symbol !== "undefined"
    ? Symbol(description)
    : `Symbol(${description})`;
}

export const ObserveSymbol = createSymbol("Observe");
export const ProxySymbol = createSymbol("Proxy");

export const ReactableObjectSymbol = createSymbol("ReactableObject");
export const ReactableArraySymbol = createSymbol("ReactableArray");
export const ReactableShadowSymbol = createSymbol("ReactableShadow");
