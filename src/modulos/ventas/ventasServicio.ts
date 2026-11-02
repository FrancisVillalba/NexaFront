import type { CommercialState, CheckoutInput } from "../../types/commercial";
import { TODAY } from "../../services/commercialConfig";
import { clone, positive, uid } from "../../services/commercialValidation";
import { stock, validQty } from "../inventario/inventarioServicio";

// Lógica local de demostración, separada de los componentes de React.
export function checkout(
  state: CommercialState,
  input: CheckoutInput,
  user: string,
) {
  const s = clone(state);
  if (!input.items.length) throw Error("Agregá al menos un producto.");
  if (!s.clients.some((c) => c.id === input.client))
    throw Error("Seleccioná un cliente.");
  const combined = new Map<number, number>();
  input.items.forEach((x) =>
    combined.set(x.productId, (combined.get(x.productId) || 0) + Number(x.qty)),
  );
  const items = [...combined].map(([id, qty]) => {
    const p = s.products.find((x) => x.id === id);
    if (!p) throw Error("Producto inexistente.");
    validQty(p, qty);
    if (qty > stock(p, input.warehouse))
      throw Error(
        "Stock insuficiente: " +
          p.name +
          ". Disponible: " +
          stock(p, input.warehouse),
      );
    return {
      productId: id,
      name: p.name,
      unit: p.unit,
      qty,
      price: p.price,
      cost: p.cost,
    };
  });
  const subtotal = items.reduce((a, x) => a + x.qty * x.price, 0),
    discount = Number(input.discount) || 0;
  if (discount < 0 || discount > subtotal)
    throw Error("El descuento no puede superar el subtotal.");
  const total = Math.round(subtotal - discount);
  if (total <= 0) throw Error("El total debe ser mayor que cero.");
  const credit = input.payment === "Crédito";
  if (credit && input.client === "c1")
    throw Error("Seleccioná un cliente identificado para vender a crédito.");
  if (credit) {
    const c = s.clients.find((x) => x.id === input.client)!,
      debt = s.invoices
        .filter((x) => x.client === c.id && x.state !== "Anulada")
        .reduce((a, x) => a + x.total - x.paid, 0);
    if (total + debt > c.credit)
      throw Error("La venta supera el límite de crédito del cliente.");
  }
  if (!credit && !s.cash.open)
    throw Error("Abrí la caja antes de registrar un cobro.");
  if (input.payment === "Efectivo" && Number(input.received) < total)
    throw Error("El monto recibido es insuficiente.");
  const number =
    s.settings.prefix +
    "-" +
    String(
      1257 +
        s.invoices.filter(
          (x) => !["f1", "f2", "f3", "f4", "f5", "f6"].includes(x.id),
        ).length,
    ).padStart(7, "0");
  const invoice = {
    id: uid(),
    number,
    date: TODAY,
    client: input.client,
    warehouse: input.warehouse,
    items,
    discount,
    total,
    paid: credit ? 0 : total,
    payment: input.payment,
    state: credit ? "Pendiente" : "Pagada",
  };
  items.forEach((x) => {
    const p = s.products.find((p) => p.id === x.productId)!;
    p.stocks[input.warehouse] =
      Math.round((stock(p, input.warehouse) - x.qty) * 100) / 100;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type: "Venta",
      qty: -x.qty,
      warehouse: input.warehouse,
      reason: "Factura " + number,
      user,
    });
  });
  s.invoices.unshift(invoice);
  if (!credit)
    s.cash.entries.unshift({
      id: uid(),
      date: TODAY,
      type: "Ingreso",
      amount: total,
      reason: "Venta " + number,
      method: input.payment,
    });
  return { state: s, invoice };
}

export function payInvoice(
  state: CommercialState,
  id: string,
  amount: number,
  method: string,
) {
  const s = clone(state),
    inv = s.invoices.find((x) => x.id === id);
  if (!s.cash.open) throw Error("Abrí la caja para registrar un cobro.");
  if (!inv || inv.state === "Anulada") throw Error("Factura inválida.");
  const a = positive(amount, "El importe");
  if (a > inv.total - inv.paid)
    throw Error("El importe supera el saldo pendiente.");
  inv.paid += a;
  inv.state = inv.paid === inv.total ? "Pagada" : "Parcial";
  s.cash.entries.unshift({
    id: uid(),
    date: TODAY,
    type: "Ingreso",
    amount: a,
    reason: "Cobro " + inv.number,
    method,
  });
  return s;
}

export function voidInvoice(state: CommercialState, id: string, user: string) {
  const s = clone(state),
    inv = s.invoices.find((x) => x.id === id);
  if (!inv || inv.state === "Anulada") throw Error("La venta ya fue anulada.");
  if (inv.paid > 0 && !s.cash.open)
    throw Error("Abrí la caja para registrar la devolución.");
  inv.items.forEach((x) => {
    const p = s.products.find((p) => p.id === x.productId)!;
    p.stocks[inv.warehouse] += x.qty;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type: "Devolución",
      qty: x.qty,
      warehouse: inv.warehouse,
      reason: "Anulación " + inv.number,
      user,
    });
  });
  if (inv.paid)
    s.cash.entries.unshift({
      id: uid(),
      date: TODAY,
      type: "Egreso",
      amount: inv.paid,
      reason: "Devolución " + inv.number,
      method: inv.payment === "Crédito" ? "Efectivo" : inv.payment,
    });
  inv.state = "Anulada";
  return s;
}
