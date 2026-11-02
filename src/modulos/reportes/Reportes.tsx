import { useState } from "react";
import * as I from "../../icons";
import { Field } from "../../components/ui";
import { TODAY, categories } from "../../services/commercialConfig";
import { money, num, date, csv } from "../../services/formatters";
import { stock } from "../inventario/inventarioServicio";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { MiniStats } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";
import { SalesChart, Composition } from "../inicio/inicioGraficos";

// Reportes y exportaciones comerciales.
export function Reports() {
  const { data, warehouse } = useApp();
  const [from, setFrom] = useState("2026-10-01"),
    [to, setTo] = useState(TODAY),
    [tab, setTab] = useState("Ventas");
  const invoices = data.invoices.filter(
      (x) =>
        x.state !== "Anulada" &&
        x.date >= from &&
        x.date <= to &&
        x.warehouse === warehouse,
    ),
    total = invoices.reduce((a, x) => a + x.total, 0),
    cost = invoices.reduce(
      (a, x) => a + x.items.reduce((t, i) => t + i.cost * i.qty, 0),
      0,
    );
  const top = data.products
    .map((p) => {
      const items = invoices
        .flatMap((x) => x.items)
        .filter((i) => i.productId === p.id);
      return {
        ...p,
        qty: items.reduce((a, i) => a + i.qty, 0),
        total: items.reduce((a, i) => a + i.qty * i.price, 0),
      };
    })
    .filter((p) => p.qty > 0)
    .sort((a, b) => b.total - a.total);
  return (
    <>
      <PageTitle
        title="Reportes"
        subtitle="Información clara para tomar mejores decisiones."
      >
        <Button
          access="reportes.exportar"
          variant="secondary"
          icon={I.Printer}
          onClick={() => window.print()}
        >
          Imprimir
        </Button>
        <Button
          access="reportes.exportar"
          icon={I.Download}
          onClick={() => {
            if (tab === "Inventario")
              csv(
                "reporte-inventario.csv",
                ["Código", "Producto", "Stock", "Costo", "Valorización"],
                data.products.map((p) => [
                  p.code,
                  p.name,
                  stock(p, warehouse),
                  p.cost,
                  stock(p, warehouse) * p.cost,
                ]),
              );
            else
              csv(
                "reporte-ventas.csv",
                ["Fecha", "Comprobante", "Total", "Cobrado"],
                invoices.map((x) => [x.date, x.number, x.total, x.paid]),
              );
          }}
        >
          Exportar CSV
        </Button>
      </PageTitle>
      <div className="report-filters">
        <Field
          label="Desde"
          type="date"
          value={from}
          max={to}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Field
          label="Hasta"
          type="date"
          value={to}
          min={from}
          max={TODAY}
          onChange={(e) => setTo(e.target.value)}
        />
        <div>
          <I.Calendar size={19} />
          <span>
            {warehouse}
            <small>
              Período: {date(from || TODAY)} al {date(to || TODAY)}
            </small>
          </span>
        </div>
      </div>
      <div className="tabs">
        {["Ventas", "Inventario", "Cuentas por cobrar"].map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === "Ventas" ? (
        <>
          <MiniStats
            items={[
              ["Ventas del período", money(total), I.Receipt, "blue"],
              [
                "Margen bruto estimado",
                money(total - cost),
                I.ChartBar,
                "green",
              ],
              [
                "Ticket promedio",
                money(invoices.length ? total / invoices.length : 0),
                I.ShoppingCart,
                "purple",
              ],
              ["Operaciones", invoices.length, I.FileText, "orange"],
            ]}
          />
          <div className="dashboard-bottom">
            <Panel title="Ventas por día · última semana" icon={I.ChartBar}>
              <SalesChart invoices={invoices} />
            </Panel>
            <Panel title="Productos más vendidos" icon={I.Package}>
              <Table
                headers={["Producto", "Cantidad", "Venta bruta"]}
                empty={!top.length}
              >
                {top.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      {num(p.qty)} {p.unit}
                    </td>
                    <td>
                      <b>{money(p.total)}</b>
                    </td>
                  </tr>
                ))}
              </Table>
            </Panel>
          </div>
          <p className="muted">
            Margen estimado = ventas menos costo registrado de los productos. No
            incluye gastos operativos.
          </p>
        </>
      ) : tab === "Inventario" ? (
        <Panel title="Valorización actual por categoría" icon={I.Box}>
          <Composition products={data.products} warehouse={warehouse} />
          <Table headers={["Categoría", "Productos", "Valor al costo"]}>
            {categories.map((c) => (
              <tr key={c}>
                <td>{c}</td>
                <td>{data.products.filter((p) => p.category === c).length}</td>
                <td>
                  {money(
                    data.products
                      .filter((p) => p.category === c)
                      .reduce((a, p) => a + stock(p, warehouse) * p.cost, 0),
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <p className="muted">
            El inventario muestra el saldo actual; no es un cierre histórico del
            período seleccionado.
          </p>
        </Panel>
      ) : (
        <Panel title="Cuentas por cobrar del período">
          <Table
            headers={["Cliente", "Comprobantes pendientes", "Saldo"]}
            empty={!invoices.some((x) => x.total > x.paid)}
          >
            {data.clients.map((c) => {
              const list = invoices.filter(
                (x) => x.client === c.id && x.total > x.paid,
              );
              return (
                list.length > 0 && (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{list.length}</td>
                    <td>
                      {money(list.reduce((a, x) => a + x.total - x.paid, 0))}
                    </td>
                  </tr>
                )
              );
            })}
          </Table>
        </Panel>
      )}
    </>
  );
}
