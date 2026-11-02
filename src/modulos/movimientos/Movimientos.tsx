import { useState } from "react";
import * as I from "../../icons";
import { Field } from "../../components/ui";
import { num, date, csv } from "../../services/formatters";
import { useApp } from "../../services/AppContext";
import { requireRecord } from "../../components/shared/helpers";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { Search } from "../../components/shared/Search";
import { ProductName } from "../../components/shared/ProductImage";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { MiniStats } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";

// Consulta de movimientos de stock.
export function Movements() {
  const { data, warehouse, movementForm } = useApp();
  const [q, setQ] = useState(""),
    [type, setType] = useState("Todos");
  const rows = data.movements.filter((m) => {
    const p = requireRecord(
      data.products.find((x) => x.id === m.productId),
      "Producto",
    );
    return (
      m.warehouse === warehouse &&
      (type === "Todos" || (type === "Entradas" ? m.qty > 0 : m.qty < 0)) &&
      (p.name + " " + m.reason + " " + p.code)
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  });
  return (
    <>
      <PageTitle
        title="Movimientos de stock"
        subtitle="Cada entrada, salida y transferencia, en un solo historial."
      >
        <Button
          access="movimientos.crear"
          icon={I.ArrowsExchange}
          onClick={() => movementForm()}
        >
          Registrar movimiento
        </Button>
      </PageTitle>
      <MiniStats
        items={[
          ["Movimientos", rows.length, I.ArrowsExchange, "blue"],
          [
            "Entradas",
            rows.filter((x) => x.qty > 0).length,
            I.ArrowUp,
            "green",
          ],
          [
            "Salidas",
            rows.filter((x) => x.qty < 0).length,
            I.ArrowDown,
            "orange",
          ],
        ]}
      />
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar producto o referencia…"
        />
        <Field label="Tipo">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {["Todos", "Entradas", "Salidas"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              "movimientos.csv",
              [
                "Fecha",
                "Producto",
                "Tipo",
                "Cantidad",
                "Depósito",
                "Referencia",
                "Usuario",
              ],
              rows.map((m) => [
                m.date,
                requireRecord(
                  data.products.find((x) => x.id === m.productId),
                  "Producto",
                ).name,
                m.type,
                m.qty,
                m.warehouse,
                m.reason,
                m.user,
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
            "Fecha",
            "Producto",
            "Tipo",
            "Cantidad",
            "Depósito",
            "Referencia",
            "Responsable",
          ]}
          empty={!rows.length}
        >
          {rows.map((m) => (
            <tr key={m.id}>
              <td>{date(m.date)}</td>
              <td>
                <ProductName
                  p={requireRecord(
                    data.products.find((x) => x.id === m.productId),
                    "Producto",
                  )}
                />
              </td>
              <td>
                <Badge>{m.type}</Badge>
              </td>
              <td className={m.qty > 0 ? "success-text" : "danger-text"}>
                <b>
                  {m.qty > 0 ? "+" : ""}
                  {num(m.qty)}
                </b>
              </td>
              <td>{m.warehouse}</td>
              <td>{m.reason}</td>
              <td>{m.user}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
