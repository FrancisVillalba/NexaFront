import type { CommercialState, MovementInput } from "../../types/commercial";
import { TODAY, warehouses } from "../../services/commercialConfig";
import { clone, positive, uid } from "../../services/commercialValidation";
import { stock, validQty } from "../inventario/inventarioServicio";

// Lógica local de demostración, separada de los componentes de React.
export function applyMovement(
  state: CommercialState,
  input: MovementInput,
  user: string,
) {
  const s = clone(state),
    p = s.products.find((x) => x.id === Number(input.productId));
  if (!p) throw Error("Seleccioná un producto.");
  const qty = positive(input.qty, "La cantidad");
  validQty(p, qty);
  if (!input.reason?.trim()) throw Error("Indicá el motivo del movimiento.");
  if (!warehouses.includes(input.warehouse)) throw Error("Depósito inválido.");
  const add = (w: string, q: number, type: string) => {
    p.stocks[w] = Math.round((stock(p, w) + q) * 100) / 100;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type,
      qty: q,
      warehouse: w,
      reason: input.reason,
      user,
    });
  };
  if (input.type === "Transferencia") {
    if (
      input.destination === input.warehouse ||
      !warehouses.includes(input.destination)
    )
      throw Error("Seleccioná otro depósito de destino.");
    if (qty > stock(p, input.warehouse))
      throw Error("No hay stock suficiente para la transferencia.");
    add(input.warehouse, -qty, "Transferencia salida");
    add(input.destination, qty, "Transferencia entrada");
  } else {
    const q = input.type === "Salida" ? -qty : qty;
    if (stock(p, input.warehouse) + q < 0)
      throw Error("No hay stock suficiente para la salida.");
    add(
      input.warehouse,
      q,
      input.type === "Ajuste" ? "Ajuste positivo" : input.type,
    );
  }
  return s;
}
