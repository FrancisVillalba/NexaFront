import { useState, useEffect } from "react";
import * as I from "../../icons";
import { IconButton, Field } from "../../components/ui";
import { categories } from "../../services/commercialConfig";
import { money, num, date, csv } from "../../services/formatters";
import { stock, status } from "./inventarioServicio";
import { useApp } from "../../services/AppContext";
import { requireRecord, cn } from "../../components/shared/helpers";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { Search } from "../../components/shared/Search";
import { ProductImage, ProductName } from "../../components/shared/ProductImage";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { Stat } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";

// Listado y detalle de productos e inventario.
export function Inventory({ title }: { title: string }) {
  const {
    data,
    warehouse,
    productForm,
    movementForm,
    inventoryQuery: q,
    setInventoryQuery: setQ,
    inventoryFilter: filter,
    setInventoryFilter: setFilter,
    go,
  } = useApp();
  const [category, setCategory] = useState("Todas"),
    [selected, setSelected] = useState(1),
    [page, setPage] = useState(1);
  const p =
      requireRecord(
        data.products.find((x) => x.id === selected),
        "Producto",
      ) || data.products[0],
    filtered = data.products.filter(
      (p) =>
        (p.name + " " + p.code + " " + p.barcode + " " + p.brand)
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (category === "Todas" || p.category === category) &&
        (filter === "Todos" ||
          (filter === "Stock bajo"
            ? stock(p, warehouse) <= p.min
            : status(p, warehouse) === filter)),
    );
  useEffect(() => setPage(1), [q, filter, category, warehouse]);
  const rows = filtered.slice((page - 1) * 7, page * 7);
  return (
    <>
      <PageTitle title={title} subtitle="Controlá tus productos y existencias.">
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              "inventario.csv",
              [
                "Código",
                "Producto",
                "Categoría",
                "Unidad",
                "Depósito",
                "Stock",
                "Mínimo",
                "Costo",
                "Precio",
              ],
              filtered.map((p) => [
                p.code,
                p.name,
                p.category,
                p.unit,
                warehouse,
                stock(p, warehouse),
                p.min,
                p.cost,
                p.price,
              ]),
            )
          }
        >
          Exportar
        </Button>
        <Button
          access="productos.crear"
          icon={I.Plus}
          onClick={() => productForm()}
        >
          Nuevo producto
        </Button>
      </PageTitle>
      <div className="inventory-layout">
        <div>
          <div className="stats-grid compact">
            <Stat
              label="Productos"
              value={data.products.length}
              note="En el catálogo"
              icon={I.Box}
              color="green"
            />
            <Stat
              label="Stock bajo"
              value={
                data.products.filter(
                  (x) =>
                    stock(x, warehouse) > 0 && stock(x, warehouse) <= x.min,
                ).length
              }
              note="Requieren atención"
              icon={I.AlertTriangle}
              color="orange"
            />
            <Stat
              label="Sin stock"
              value={
                data.products.filter((x) => stock(x, warehouse) === 0).length
              }
              note="En este depósito"
              icon={I.X}
              color="red"
            />
            <Stat
              label="Valor del inventario"
              value={money(
                data.products.reduce(
                  (a, p) => a + stock(p, warehouse) * p.cost,
                  0,
                ),
              )}
              note="Valorizado al costo"
              icon={I.Receipt}
            />
          </div>
          <div className="filter-bar">
            <Search
              value={q}
              onChange={setQ}
              placeholder="Buscar por nombre, SKU o código de barras…"
            />
            <Field label="Categoría">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Todas</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["Todos", "Disponible", "Stock bajo", "Sin stock"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <Panel>
            <Table
              headers={[
                "Código",
                "Producto",
                "Stock",
                "Mínimo",
                "Precio de venta",
                "Estado",
                "",
              ]}
              empty={!rows.length}
            >
              {rows.map((x) => (
                <tr
                  key={x.id}
                  className={cn("clickable", x.id === p.id && "row-selected")}
                  onClick={() => setSelected(x.id)}
                >
                  <td className="muted">{x.code}</td>
                  <td>
                    <button
                      className="product-button"
                      onClick={() => setSelected(x.id)}
                    >
                      <ProductName p={x} />
                    </button>
                  </td>
                  <td>
                    <b>{num(stock(x, warehouse))}</b>
                    <small className="block">{x.unit}</small>
                  </td>
                  <td>{num(x.min)}</td>
                  <td className="nowrap">{money(x.price)}</td>
                  <td>
                    <Badge>{status(x, warehouse)}</Badge>
                  </td>
                  <td>
                    <IconButton
                      access="productos.editar"
                      icon={I.Edit}
                      label={"Editar " + x.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        productForm(x);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </Table>
            <div className="pagination">
              <small>
                Mostrando {filtered.length ? (page - 1) * 7 + 1 : 0}–
                {Math.min(page * 7, filtered.length)} de {filtered.length}{" "}
                productos
              </small>
              <div>
                <IconButton
                  icon={I.ArrowLeft}
                  label="Página anterior"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                />
                <b>{page}</b>
                <IconButton
                  icon={I.ChevronRight}
                  label="Página siguiente"
                  disabled={page * 7 >= filtered.length}
                  onClick={() => setPage(page + 1)}
                />
              </div>
            </div>
          </Panel>
        </div>
        <aside className="product-detail">
          <Button
            access="movimientos.crear"
            variant="secondary"
            icon={I.ArrowsExchange}
            onClick={() => movementForm(p)}
          >
            Registrar movimiento
          </Button>
          <Panel>
            <div className="detail-hero">
              <ProductImage product={p} large />
              <h2>{p.name}</h2>
              <p>Código: {p.code}</p>
              <span>{p.brand}</span>
            </div>
            <div className="stock-pair">
              <div>
                <small>Stock actual</small>
                <strong>{num(stock(p, warehouse))}</strong>
                <span>{p.unit}</span>
              </div>
              <div>
                <small>Stock mínimo</small>
                <strong>{p.min}</strong>
                <span>{p.unit}</span>
              </div>
            </div>
            <Badge>{status(p, warehouse)}</Badge>
            <dl>
              <div>
                <dt>Categoría</dt>
                <dd>{p.category}</dd>
              </div>
              <div>
                <dt>Depósito</dt>
                <dd>{warehouse}</dd>
              </div>
              <div>
                <dt>Precio de venta</dt>
                <dd>{money(p.price)}</dd>
              </div>
            </dl>
            <div className="detail-subtitle">
              <b>Movimientos recientes</b>
              <Button access="movimientos.ver" variant="text" onClick={() => go("movimientos")}>
                Ver todos
              </Button>
            </div>
            {data.movements
              .filter((x) => x.productId === p.id)
              .slice(0, 2)
              .map((m) => (
                <div className="recent-move" key={m.id}>
                  <span
                    className={"soft-icon " + (m.qty > 0 ? "green" : "red")}
                  >
                    {m.qty > 0 ? (
                      <I.ArrowUp size={18} />
                    ) : (
                      <I.ArrowDown size={18} />
                    )}
                  </span>
                  <div>
                    <b>{m.type}</b>
                    <small>{date(m.date)}</small>
                  </div>
                  <strong
                    className={m.qty > 0 ? "success-text" : "danger-text"}
                  >
                    {m.qty > 0 ? "+" : ""}
                    {num(m.qty)}
                  </strong>
                </div>
              ))}
            {!data.movements.some((x) => x.productId === p.id) && (
              <p className="muted">
                Aún no hay movimientos para este producto.
              </p>
            )}
            <Button
              access="productos.editar"
              variant="outline full"
              icon={I.Edit}
              onClick={() => productForm(p)}
            >
              Editar producto
            </Button>
          </Panel>
        </aside>
      </div>
    </>
  );
}
