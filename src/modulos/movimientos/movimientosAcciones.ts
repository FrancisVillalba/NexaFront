import type { Product } from "../../types/commercial";
import { warehouses } from "../../services/commercialConfig";
import { applyMovement } from "./movimientosServicio";
import type { AppContext } from "../../uiTypes";
import type { User } from "../../types";

// Abre el formulario del módulo y conserva sus validaciones y permisos.
type ActionsContext = Pick<
  AppContext,
  "data"
  | "can"
  | "notify"
  | "commit"
  | "form"
  | "warehouse"
> & {
   user: User | null;
};

export function useMovementActions({
  data,
  can,
  notify,
  commit,
  form,
  warehouse,
  user,
}: ActionsContext) {
  function movementForm(p?: Product, type = "Entrada") {
    if (!can("movimientos.crear")) {
      notify("No tenés permiso para registrar movimientos de stock.", true);
      return;
    }
    form(
      "Registrar movimiento",
      [
        {
          name: "productId",
          label: "Producto",
          options: data.products.map((x) => ({
            value: x.id,
            label: x.code + " · " + x.name,
          })),
          placeholder: "Seleccionar producto",
        },
        {
          name: "type",
          label: "Tipo de movimiento",
          options: ["Entrada", "Salida", "Ajuste", "Transferencia"],
        },
        { name: "warehouse", label: "Depósito de origen", options: warehouses },
        {
          name: "destination",
          label: "Depósito de destino",
          options: warehouses,
          when: (v) => v.type === "Transferencia",
        },
        { name: "qty", label: "Cantidad", type: "number", min: 0.01 },
        { name: "reason", label: "Motivo / referencia" },
      ],
      {
        productId: p?.id || "",
        type,
        warehouse,
        destination:
          warehouse === warehouses[0] ? warehouses[1] : warehouses[0],
        qty: 1,
        reason: "",
      },
      (v) =>
        commit(
          applyMovement(
            data,
            {
              productId: String(v.productId ?? ""),
              qty: Number(v.qty),
              reason: String(v.reason ?? ""),
              type: String(v.type ?? ""),
              warehouse: String(v.warehouse ?? ""),
              destination: String(v.destination ?? ""),
            },
            user!.name,
          ),
          "Movimiento registrado",
        ),
      "Para reducir existencias, usá Salida. Ajuste registra una corrección positiva.",
    );
  }
return { movementForm };
}
