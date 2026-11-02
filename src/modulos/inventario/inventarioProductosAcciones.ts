import type { Product } from "../../types/commercial";
import type { FormField, AppContext } from "../../uiTypes";
import { categories } from "../../services/commercialConfig";
import { validQty } from "./inventarioServicio";

// Abre el formulario del módulo y conserva sus validaciones y permisos.
type ActionsContext = Pick<
  AppContext,
  "data"
  | "can"
  | "notify"
  | "commit"
  | "form"
>;

export function useProductActions({
  data,
  can,
  notify,
  commit,
  form,
}: ActionsContext) {
  function productForm(p?: Product) {
    if (!can(p ? "productos.editar" : "productos.crear")) {
      notify("No tenés permiso para crear o editar productos.", true);
      return;
    }
    const fields: FormField[] = [
      { name: "name", label: "Nombre del producto" },
      { name: "code", label: "Código / SKU" },
      { name: "barcode", label: "Código de barras", required: false },
      { name: "brand", label: "Marca" },
      { name: "category", label: "Categoría", options: categories },
      {
        name: "unit",
        label: "Unidad de venta",
        options: ["unidad", "caja", "metro", "kilo", "bolsa", "par"],
      },
      { name: "cost", label: "Costo de compra (Gs.)", type: "number", min: 0 },
      { name: "price", label: "Precio de venta (Gs.)", type: "number", min: 1 },
      { name: "min", label: "Stock mínimo", type: "number", min: 0 },
    ];
    if (!p)
      fields.push(
        {
          name: "central",
          label: "Stock inicial · Casa central",
          type: "number",
          min: 0,
        },
        {
          name: "north",
          label: "Stock inicial · Depósito Norte",
          type: "number",
          min: 0,
        },
      );
    form(
      p ? "Editar producto" : "Nuevo producto",
      fields,
      p
        ? {
            name: p.name,
            code: p.code,
            barcode: p.barcode,
            brand: p.brand,
            category: p.category,
            unit: p.unit,
            cost: p.cost,
            price: p.price,
            min: p.min,
          }
        : {
            category: "Herramientas",
            unit: "unidad",
            cost: 0,
            price: 0,
            min: 5,
            central: 0,
            north: 0,
          },
      (v) => {
        const s = structuredClone(data);
        if (
          s.products.some(
            (x) =>
              x.id !== p?.id &&
              x.code.toLowerCase() === String(v.code).trim().toLowerCase(),
          )
        )
          throw Error("Ya existe un producto con ese código.");
        const item: Product = {
          ...p,
          barcode: String(v.barcode ?? ""),
          brand: String(v.brand ?? ""),
          category: String(v.category ?? ""),
          unit: String(v.unit ?? ""),
          id: p?.id || Math.max(...s.products.map((x) => x.id)) + 1,
          name: String(v.name).trim(),
          code: String(v.code).trim(),
          cost: Number(v.cost),
          price: Number(v.price),
          min: Number(v.min),
          stocks: p?.stocks || {
            "Casa central": Number(v.central),
            "Depósito Norte": Number(v.north),
          },
        };
        for (const q of Object.values(item.stocks))
          if (q > 0) validQty(item, q);
        s.products = p
          ? s.products.map((x) => (x.id === p.id ? item : x))
          : [...s.products, item];
        commit(s, p ? "Producto actualizado" : "Producto creado");
      },
      "Los movimientos posteriores se registran desde Movimientos de stock.",
    );
  }
return { productForm };
}
