import type { Invoice } from "../../types/commercial";
import { money } from "../../services/formatters";
import { payInvoice } from "./ventasServicio";
import type { AppContext } from "../../uiTypes";

// Abre el formulario del módulo y conserva sus validaciones y permisos.
type ActionsContext = Pick<
  AppContext,
  "data"
  | "can"
  | "notify"
  | "commit"
  | "form"
>;

export function usePaymentActions({
  data,
  can,
  notify,
  commit,
  form,
}: ActionsContext) {
  function pay(inv: Invoice) {
    if (!can("ventas.cobrar")) {
      notify("No tenés permiso para registrar cobros.", true);
      return;
    }
    form(
      "Registrar cobro",
      [
        {
          name: "amount",
          label: "Importe a cobrar (Gs.)",
          type: "number",
          min: 1,
          max: inv.total - inv.paid,
        },
        {
          name: "method",
          label: "Forma de pago",
          options: ["Efectivo", "Tarjeta", "Transferencia"],
        },
      ],
      { amount: inv.total - inv.paid, method: "Efectivo" },
      (v) =>
        commit(
          payInvoice(data, inv.id, Number(v.amount), String(v.method)),
          "Cobro registrado",
        ),
      "Saldo pendiente: " + money(inv.total - inv.paid),
    );
  }
return { pay };
}
