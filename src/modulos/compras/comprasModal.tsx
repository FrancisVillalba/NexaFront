import type { PurchaseItem } from "../../types";
import { useState } from "react";
import * as I from "../../icons";
import { IconButton, Field, Modal } from "../../components/ui";
import { TODAY, warehouses } from "../../services/commercialConfig";
import { uid } from "../../services/commercialValidation";
import { money, num } from "../../services/formatters";
import { validQty } from "../inventario/inventarioServicio";
import { useApp } from "../../services/AppContext";
import { requireRecord } from "../../components/shared/helpers";
import { Button } from "../../components/shared/Button";
import { Table } from "../../components/shared/Table";

// Formulario de una nueva compra.
export function PurchaseModal() {
  const { data, warehouse, commit, setModal } = useApp();
  const [supplier, setSupplier] = useState(data.suppliers[0].id),
    [depot, setDepot] = useState(warehouse),
    [productId, setProductId] = useState(data.products[0].id),
    [qty, setQty] = useState(1),
    [items, setItems] = useState<PurchaseItem[]>([]),
    [error, setError] = useState("");
  const total = items.reduce((a, x) => a + x.qty * x.cost, 0);
  function add() {
    try {
      const p = requireRecord(
        data.products.find((x) => x.id === Number(productId)),
        "Producto",
      );
      validQty(p, Number(qty));
      if (items.some((x) => x.productId === p.id))
        throw Error(
          "El producto ya está en la orden. Quitalo para modificar la cantidad.",
        );
      setItems([
        ...items,
        { productId: p.id, name: p.name, qty: Number(qty), cost: p.cost },
      ]);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    }
  }
  return (
    <Modal title="Nueva orden de compra" onClose={() => setModal(null)} wide>
      <div className="form-grid">
        <Field label="Proveedor">
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            {data.suppliers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Depósito de recepción">
          <select value={depot} onChange={(e) => setDepot(e.target.value)}>
            {warehouses.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="purchase-add">
        <Field label="Producto">
          <select
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
          >
            {data.products.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Cantidad"
          type="number"
          min="0.01"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <Button icon={I.Plus} onClick={add}>
          Agregar
        </Button>
      </div>
      <Table
        headers={["Producto", "Cantidad", "Costo", "Importe", ""]}
        empty={!items.length}
      >
        {items.map((x) => (
          <tr key={x.productId}>
            <td>{x.name}</td>
            <td>{num(x.qty)}</td>
            <td>{money(x.cost)}</td>
            <td>{money(x.qty * x.cost)}</td>
            <td>
              <IconButton
                icon={I.X}
                label={"Quitar " + x.name}
                onClick={() =>
                  setItems(items.filter((i) => i.productId !== x.productId))
                }
              />
            </td>
          </tr>
        ))}
      </Table>
      <div className="total">
        <span>Total de la orden</span>
        <strong>{money(total)}</strong>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <Button variant="secondary" onClick={() => setModal(null)}>
          Cancelar
        </Button>
        <Button
          access="compras.crear"
          disabled={!items.length}
          onClick={() => {
            const s = structuredClone(data);
            s.purchases.unshift({
              id: uid(),
              number:
                "OC-" + String(129 + s.purchases.length - 2).padStart(5, "0"),
              date: TODAY,
              supplier,
              warehouse: depot,
              items,
              total,
              state: "Pendiente",
            });
            commit(s, "Orden de compra creada");
            setModal(null);
          }}
        >
          Crear orden
        </Button>
      </div>
    </Modal>
  );
}
