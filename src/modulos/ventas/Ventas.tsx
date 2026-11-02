import { useState } from "react";
import * as I from "../../icons";
import { IconButton, Field } from "../../components/ui";
import { money, date, csv } from "../../services/formatters";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { Search } from "../../components/shared/Search";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { MiniStats } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";

// Listado de ventas y acciones permitidas.
export function Sales() {
  const { data, warehouse, openSale, viewInvoice, pay } = useApp();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("Todas");
  const rows = data.invoices.filter(
    (x) =>
      x.warehouse === warehouse &&
      (x.number + " " + data.clients.find((c) => c.id === x.client)?.name)
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (filter === "Todas" ||
        (filter === "Pendientes"
          ? x.total > x.paid && x.state !== "Anulada"
          : x.state === filter)),
  );
  return (
    <>
      <PageTitle
        title="Ventas y facturación"
        subtitle="Tus comprobantes, cobros y cuentas pendientes."
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
      <MiniStats
        items={[
          [
            "Ventas registradas",
            data.invoices.filter((x) => x.state !== "Anulada").length,
            I.Receipt,
            "blue",
          ],
          [
            "Total vendido",
            money(
              data.invoices
                .filter((x) => x.state !== "Anulada")
                .reduce((a, x) => a + x.total, 0),
            ),
            I.ChartBar,
            "green",
          ],
          [
            "Saldo por cobrar",
            money(
              data.invoices
                .filter((x) => x.state !== "Anulada")
                .reduce((a, x) => a + x.total - x.paid, 0),
            ),
            I.Clock,
            "orange",
          ],
        ]}
      />
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar comprobante o cliente…"
        />
        <Field label="Estado">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["Todas", "Pendientes", "Pagada", "Parcial", "Anulada"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </Field>
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              "ventas.csv",
              ["Comprobante", "Fecha", "Cliente", "Total", "Cobrado", "Estado"],
              rows.map((x) => [
                x.number,
                x.date,
                data.clients.find((c) => c.id === x.client)?.name,
                x.total,
                x.paid,
                x.state,
              ]),
            )
          }
        >
          Exportar
        </Button>
      </div>
      <Panel>
        <Table
          headers={[
            "Comprobante",
            "Fecha",
            "Cliente",
            "Forma de pago",
            "Total",
            "Saldo",
            "Estado",
            "Acciones",
          ]}
          empty={!rows.length}
        >
          {rows.map((x) => (
            <tr key={x.id}>
              <td>
                <button className="table-link" onClick={() => viewInvoice(x)}>
                  {x.number}
                </button>
              </td>
              <td>{date(x.date)}</td>
              <td>{data.clients.find((c) => c.id === x.client)?.name}</td>
              <td>{x.payment}</td>
              <td className="nowrap">
                <b>{money(x.total)}</b>
              </td>
              <td className="nowrap">
                {x.state === "Anulada" ? "—" : money(x.total - x.paid)}
              </td>
              <td>
                <Badge>{x.state}</Badge>
              </td>
              <td>
                <div className="row-actions">
                  <IconButton
                    access="ventas.ver"
                    icon={I.Eye}
                    label={"Ver comprobante " + x.number}
                    onClick={() => viewInvoice(x)}
                  />
                  {x.total > x.paid && x.state !== "Anulada" && (
                    <Button
                      access="ventas.cobrar"
                      variant="outline small"
                      onClick={() => pay(x)}
                    >
                      Cobrar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
