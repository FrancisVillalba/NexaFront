import type { CommercialState } from "../../types/commercial";
import { TODAY } from "../../services/commercialConfig";
import { clone, uid } from "../../services/commercialValidation";
import { stock, validQty } from "../inventario/inventarioServicio";

// Lógica local de demostración, separada de los componentes de React.
export function receivePurchase(
  state: CommercialState,
  id: string,
  user: string,
) {
  const s = clone(state),
    o = s.purchases.find((x) => x.id === id);
  if (!o || o.state !== "Pendiente")
    throw Error("La orden ya fue recibida o anulada.");
  o.items.forEach((x) => {
    const p = s.products.find((p) => p.id === x.productId)!;
    validQty(p, x.qty);
    p.stocks[o.warehouse] =
      Math.round((stock(p, o.warehouse) + x.qty) * 100) / 100;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type: "Entrada",
      qty: x.qty,
      warehouse: o.warehouse,
      reason: "Recepción " + o.number,
      user,
    });
  });
  o.state = "Recibida";
  return s;
}
