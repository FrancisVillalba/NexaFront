import type { CashState } from "../../types/commercial";

// Lógica local de demostración, separada de los componentes de React.
export const cashExpected = (c: CashState) =>
  c.opening +
  c.entries
    .filter((e) => e.method === "Efectivo")
    .reduce((a, e) => a + (e.type === "Ingreso" ? e.amount : -e.amount), 0);
