export function createSymbol(description: string) {
  return typeof Symbol !== "undefined" ?
    Symbol(description) : `Symbol(${description})`
}

export const ObserveSymbol = createSymbol('Observe');
export const ProxySymbol = createSymbol('Proxy');
export const ArrayWrapedSymbol = createSymbol('ArrayWraped');
export const LoseProxyShadowSymbol = createSymbol('LoseProxyShadow');