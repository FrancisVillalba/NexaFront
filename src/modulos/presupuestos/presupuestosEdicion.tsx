import type { Product } from "../../types/commercial";
import { useState } from "react";
import * as I from "../../icons";
import { IconButton, Field } from "../../components/ui";
import { TODAY } from "../../services/commercialConfig";
import { uid } from "../../services/commercialValidation";
import { money, num } from "../../services/formatters";
import { stock } from "../inventario/inventarioDemostracion";
import { useApp } from "../../services/AppContext";
import { requireRecord } from "../../components/shared/helpers";
import { Button } from "../../components/shared/Button";
import { Empty } from "../../components/shared/Empty";
import { ProductImage, ProductName } from "../../components/shared/ProductImage";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { Table } from "../../components/shared/Table";

// Editor local de presupuestos, separado del registro de ventas reales.
export function PresupuestosEdicion() {
  const quoteOnly = true;
  const { can, contactosCargando } = useApp();
  const clientesActivos = useApp().data.clients.filter(cliente => cliente.active === true);
  const {
    data,
    warehouse,
    cart,
    setCart,
    saleClient,
    setSaleClient,
    saleDiscount,
    go,
    commit,
  } = useApp();
  const [q, setQ] = useState(""),
    [payment, setPayment] = useState("Efectivo"),
    [discount, setDiscount] = useState(saleDiscount || 0),
    [error, setError] = useState("");
  const items = cart.map((x) => ({
      ...x,
      p: requireRecord(
        data.products.find((p) => p.id === x.productId),
        "Producto",
      ),
    })),
    subtotal = items.reduce((a, x) => a + x.qty * x.p.price, 0),
    total = Math.max(0, Math.round(subtotal - Number(discount))),
    matches = data.products.filter((p) =>
      (p.name + " " + p.code + " " + p.barcode)
        .toLowerCase()
        .includes(q.toLowerCase()),
    );
  function add(p: Product) {
    setError("");
    if (stock(p, warehouse) <= 0) {
      setError("Este producto no tiene stock en " + warehouse + ".");
      return;
    }
    const existing = cart.find((x) => x.productId === p.id),
      qty = (existing?.qty || 0) + 1;
    if (qty > stock(p, warehouse)) {
      setError("No hay más stock disponible para " + p.name + ".");
      return;
    }
    setCart(
      existing
        ? cart.map((x) => (x.productId === p.id ? { ...x, qty } : x))
        : [...cart, { productId: p.id, qty: 1 }],
    );
    setQ("");
  }
  function saveQuote() {
    if (!can("presupuestos.crear")) return;
    if (contactosCargando || !clientesActivos.some(cliente => cliente.id === saleClient)) {
      setError("Seleccioná un cliente activo del backend.");
      return;
    }
    if (!cart.length) {
      setError("Agregá productos antes de guardar.");
      return;
    }
    const s = structuredClone(data);
    s.quotes.unshift({
      id: uid(),
      number: "PRE-" + String(s.quotes.length + 1).padStart(5, "0"),
      date: TODAY,
      client: saleClient,
      warehouse,
      items: cart.map((x) => ({ ...x })),
      discount: Number(discount) || 0,
      total,
      state: "Borrador",
    });
    commit(s, "Presupuesto guardado");
    setCart([]);
    go("presupuestos");
  }
  return (
    <>
      <PageTitle
        title={quoteOnly ? "Nuevo presupuesto" : "Nueva venta"}
        subtitle="Registrá la venta y actualizá el stock en un solo paso."
      >
        <Button
          variant="secondary"
          icon={I.ArrowLeft}
          onClick={() => go(quoteOnly ? "presupuestos" : "ventas")}
        >
          {quoteOnly ? "Volver a presupuestos" : "Volver a ventas"}
        </Button>
      </PageTitle>
      <div className="pos-layout">
        <Panel className="pos-products">
          <div className="pos-fields">
            <Field label="Cliente">
              <select
                value={clientesActivos.some(cliente => cliente.id === saleClient) ? saleClient : ""}
                disabled={contactosCargando || !can("clientes.ver")}
                onChange={(e) => setSaleClient(e.target.value)}
              >
                <option value="">{contactosCargando ? "Cargando clientes…" : "Seleccionar cliente"}</option>
                {clientesActivos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {!can("clientes.ver") ? <small>Necesitás permiso para consultar Clientes.</small> : !contactosCargando && !clientesActivos.length && <small>No hay clientes activos. Registrá uno desde Clientes.</small>}
            </Field>
            <Field label="Condición de venta">
              <select
                value={payment === "Crédito" ? "Crédito" : "Contado"}
                onChange={(e) =>
                  setPayment(
                    e.target.value === "Crédito" ? "Crédito" : "Efectivo",
                  )
                }
              >
                <option>Contado</option>
                <option>Crédito</option>
              </select>
            </Field>
            <Field label="Depósito">
              <input readOnly value={warehouse} />
            </Field>
          </div>
          <form
            className="pos-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (matches[0]) add(matches[0]);
            }}
          >
            <I.Barcode size={26} />
            <input
              aria-label="Buscar producto para la venta"
              placeholder="Buscar producto o escanear código…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button
              type="submit"
              icon={I.Search}
              aria-label="Agregar primer resultado"
            />
          </form>
          {q ? (
            <div className="product-results">
              {matches.slice(0, 6).map((p) => (
                <button key={p.id} onClick={() => add(p)}>
                  <ProductName p={p} />
                  <span>
                    {money(p.price)}
                    <small>
                      {num(stock(p, warehouse))} {p.unit} disponibles
                    </small>
                  </span>
                  <I.Plus size={18} />
                </button>
              ))}
              {!matches.length && <Empty />}
            </div>
          ) : (
            <div className="recommended">
              <b>Productos frecuentes</b>
              <div>
                {[data.products[0], data.products[2], data.products[1]].map(
                  (p) => (
                    <button
                      key={p.id}
                      onClick={() => add(p)}
                      aria-label={"Agregar " + p.name}
                    >
                      <ProductImage product={p} />
                      <span>
                        {p.name}
                        <small>{money(p.price)}</small>
                      </span>
                      <I.Plus size={20} />
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
          <Table
            headers={["", "Producto", "Cantidad", "Precio", "Importe", "Stock"]}
            empty={!cart.length}
          >
            {items.map(({ p, qty, productId }) => (
              <tr key={productId}>
                <td>
                  <IconButton
                    icon={I.X}
                    label={"Quitar " + p.name}
                    onClick={() =>
                      setCart(cart.filter((x) => x.productId !== productId))
                    }
                  />
                </td>
                <td>
                  <ProductName p={p} />
                </td>
                <td>
                  <div className="quantity">
                    <button
                      aria-label={"Restar " + p.name}
                      onClick={() =>
                        setCart(
                          cart.map((x) =>
                            x.productId === productId
                              ? { ...x, qty: Math.max(1, x.qty - 1) }
                              : x,
                          ),
                        )
                      }
                    >
                      <I.Minus size={13} />
                    </button>
                    <input
                      aria-label={"Cantidad " + p.name}
                      type="number"
                      min={["metro", "kilo"].includes(p.unit) ? 0.01 : 1}
                      step={["metro", "kilo"].includes(p.unit) ? 0.01 : 1}
                      value={qty}
                      onChange={(e) =>
                        setCart(
                          cart.map((x) =>
                            x.productId === productId
                              ? { ...x, qty: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                    <button
                      aria-label={"Sumar " + p.name}
                      onClick={() =>
                        setCart(
                          cart.map((x) =>
                            x.productId === productId
                              ? { ...x, qty: x.qty + 1 }
                              : x,
                          ),
                        )
                      }
                    >
                      <I.Plus size={13} />
                    </button>
                  </div>
                  <small className="block">{p.unit}</small>
                </td>
                <td className="nowrap">{money(p.price)}</td>
                <td className="nowrap">
                  <b>{money(qty * p.price)}</b>
                </td>
                <td>
                  <span className="stock-note">
                    {num(stock(p, warehouse))} disp.
                  </span>
                </td>
              </tr>
            ))}
          </Table>
          <div className="pos-bottom">
            <I.InfoCircle size={17} />
            <span>
              Presupuesto de demostración. No modifica el inventario real.
            </span>
          </div>
        </Panel>
        <Panel className="checkout">
          <h2>
            <I.ShoppingCart size={24} /> Resumen de presupuesto
          </h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            <div>
              <dt>
                <label htmlFor="discount">Descuento (Gs.)</label>
              </dt>
              <dd>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </dd>
            </div>
          </dl>
          <div className="total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <Button
            access="presupuestos.crear"
            variant="secondary full"
            icon={I.FileText}
            disabled={!cart.length || contactosCargando || !clientesActivos.some(cliente => cliente.id === saleClient)}
            onClick={saveQuote}
          >
            Guardar presupuesto
          </Button>
        </Panel>
      </div>
    </>
  );
}
