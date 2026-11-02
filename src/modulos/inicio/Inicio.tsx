import * as I from "../../icons";
import { money, num, date } from "../../services/formatters";
import { stock, status } from "../inventario/inventarioServicio";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { ProductName } from "../../components/shared/ProductImage";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { Stat } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";
import { SalesChart, Composition } from "./inicioGraficos";

// Pantalla de inicio con indicadores de los datos comerciales.
export function Dashboard() {
  const {
    data,
    warehouse,
    go,
    openSale,
    setInventoryFilter,
    movementForm,
    viewInvoice,
  } = useApp();
  const invoices = data.invoices.filter(
      (x) => x.state !== "Anulada" && x.warehouse === warehouse,
    ),
    low = data.products.filter((p) => stock(p, warehouse) <= p.min),
    debt = invoices.filter((x) => x.total > x.paid),
    total = invoices.reduce((a, x) => a + x.total, 0);
  return (
    <>
      <PageTitle
        title="Resumen del negocio"
        subtitle="Hoy es lunes, 26 de octubre de 2026"
      >
        <Button
          access="ventas.crear"
          icon={I.Plus}
          variant="green"
          onClick={openSale}
        >
          Nueva venta
        </Button>
      </PageTitle>
      <div className="stats-grid">
        <Stat
          label="Ventas del mes"
          value={money(total)}
          note={invoices.length + " ventas registradas"}
          icon={I.ShoppingCart}
          color="green"
          onClick={() => go("ventas")}
        />
        <Stat
          label="Productos"
          value={num(data.products.length)}
          note="Productos en tu catálogo"
          icon={I.Box}
          onClick={() => go("inventario")}
        />
        <Stat
          label="Stock bajo"
          value={low.length}
          note="Productos por reponer"
          icon={I.AlertTriangle}
          color="orange"
          onClick={() => {
            setInventoryFilter("Stock bajo");
            go("inventario");
          }}
        />
        <Stat
          label="Facturas pendientes"
          value={debt.length}
          note={money(debt.reduce((a, x) => a + x.total - x.paid, 0))}
          icon={I.Receipt}
          color="purple"
          onClick={() => go("ventas")}
        />
      </div>
      <div className="dashboard-main">
        <Panel
          title="Productos con stock bajo"
          icon={I.AlertTriangle}
          color="red"
          action={
            <Button
              variant="text"
              onClick={() => {
                setInventoryFilter("Stock bajo");
                go("inventario");
              }}
            >
              Ver inventario <I.ArrowRight size={16} />
            </Button>
          }
        >
          <Table
            headers={[
              "Código / producto",
              "Disponible",
              "Mínimo",
              "Estado",
              "",
            ]}
            empty={!low.length}
          >
            {low.slice(0, 6).map((p) => (
              <tr key={p.id}>
                <td>
                  <ProductName p={p} />
                </td>
                <td className="danger-text">
                  <b>{num(stock(p, warehouse))}</b> <small>{p.unit}</small>
                </td>
                <td>{p.min}</td>
                <td>
                  <Badge>{status(p, warehouse)}</Badge>
                </td>
                <td>
                  <Button
                    access="movimientos.crear"
                    variant="outline small"
                    icon={I.Plus}
                    onClick={() => movementForm(p)}
                  >
                    Reponer
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel
          title="Últimas ventas"
          icon={I.ChartBar}
          color="green"
          action={
            <Button variant="text" onClick={() => go("ventas")}>
              Ver todas <I.ArrowRight size={16} />
            </Button>
          }
        >
          <Table
            headers={["Comprobante", "Cliente", "Total", "Estado"]}
            empty={!invoices.length}
          >
            {invoices.slice(0, 6).map((x) => (
              <tr
                key={x.id}
                onClick={() => viewInvoice(x)}
                className="clickable"
              >
                <td>
                  <button
                    className="table-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewInvoice(x);
                    }}
                  >
                    {x.number.slice(-7)}
                  </button>
                  <small className="block">{date(x.date)}</small>
                </td>
                <td>{data.clients.find((c) => c.id === x.client)?.name}</td>
                <td className="nowrap">
                  <b>{money(x.total)}</b>
                </td>
                <td>
                  <Badge>{x.state}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title="Ventas de los últimos 7 días"
          icon={I.ChartBar}
          action={
            <span className="panel-total">
              <small>Total del período</small>
              <b>{money(total)}</b>
            </span>
          }
        >
          <SalesChart invoices={invoices} />
        </Panel>
        <Panel
          title="Composición del inventario"
          icon={I.ChartBar}
          color="purple"
        >
          <Composition products={data.products} warehouse={warehouse} />
        </Panel>
      </div>
    </>
  );
}
