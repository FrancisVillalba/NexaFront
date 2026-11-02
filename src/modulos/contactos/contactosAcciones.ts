import type { Contact } from "../../types/commercial";
import { uid } from "../../services/commercialValidation";
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

export function useContactActions({
  data,
  can,
  notify,
  commit,
  form,
}: ActionsContext) {
  function contactForm(type: string, item?: Contact) {
    if (!can(`${type}.${item ? "editar" : "crear"}`)) {
      notify("No tenés permiso para esta operación.", true);
      return;
    }
    const clients = type === "clientes",
      key = clients ? "clients" : "suppliers";
    form(
      item
        ? "Editar " + (clients ? "cliente" : "proveedor")
        : "Nuevo " + (clients ? "cliente" : "proveedor"),
      [
        { name: "name", label: "Nombre / razón social" },
        { name: "doc", label: "RUC / documento" },
        { name: "phone", label: "Teléfono", required: false },
        {
          name: "email",
          label: "Correo electrónico",
          type: "email",
          required: false,
        },
        { name: "address", label: "Dirección", required: false },
        ...(clients
          ? [
              {
                name: "credit",
                label: "Límite de crédito (Gs.)",
                type: "number",
                min: 0,
              },
            ]
          : []),
      ],
      item
        ? {
            name: item.name,
            doc: item.doc,
            phone: item.phone,
            email: item.email,
            address: item.address,
            credit: item.credit ?? 0,
          }
        : { credit: 0 },
      (v) => {
        const s = structuredClone(data),
          c = {
            name: String(v.name ?? ""),
            doc: String(v.doc ?? ""),
            phone: String(v.phone ?? ""),
            email: String(v.email ?? ""),
            address: String(v.address ?? ""),
            id: item?.id || uid(),
            credit: Number(v.credit) || 0,
          };
        if (clients)
          s.clients = item
            ? s.clients.map((x) => (x.id === item.id ? c : x))
            : [...s.clients, c];
        else
          s.suppliers = item
            ? s.suppliers.map((x) => (x.id === item.id ? c : x))
            : [...s.suppliers, c];
        commit(s, (clients ? "Cliente" : "Proveedor") + " guardado");
      },
    );
  }
return { contactForm };
}
