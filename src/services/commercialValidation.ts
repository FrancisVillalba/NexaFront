import type { CommercialState } from "../types/commercial";

// Lógica local de demostración, separada de los componentes de React.
export const clone = (s: CommercialState) => structuredClone(s);

export const positive = (n: number | string, label: string) => {
  if (!Number.isFinite(Number(n)) || Number(n) <= 0)
    throw Error(label + " debe ser mayor que cero.");
  return Number(n);
};

export const uid = () => globalThis.crypto.randomUUID();
