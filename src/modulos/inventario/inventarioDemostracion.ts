import type { Product } from "../../types/commercial";
import { positive } from "../../services/commercialValidation";

// Lógica local de demostración, separada de los componentes de React.
export const stock = (p: Product, w = "Casa central") =>
  Number(p.stocks[w] || 0);

export const status = (p: Product, w: string) =>
  stock(p, w) === 0
    ? "Sin stock"
    : stock(p, w) <= p.min
      ? "Stock bajo"
      : "Disponible";

export function validQty(p: Product, qty: number | string) {
  positive(qty, "La cantidad");
  if (!["metro", "kilo"].includes(p.unit) && !Number.isInteger(Number(qty)))
    throw Error("Usá cantidades enteras para " + p.name + ".");
}
