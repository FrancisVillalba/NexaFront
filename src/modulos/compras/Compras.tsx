import { useState } from "react";
import * as I from "../../icons";
import { money, date } from "../../services/formatters";
import { receivePurchase } from "./comprasServicio";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { Search } from "../../components/shared/Search";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { MiniStats } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";

// Listado de compras y recepción de mercadería.
export function Purchases() {
  const { data, warehouse, setModal, act, user } = useApp();
  const [q, setQ] = useState("");
  const rows = data.purchases.filter(
    (x) =>
      x.warehouse === warehouse &&
      (x.number + " " + data.suppliers.find((s) => s.id === x.supplier)?.name)
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Compras"
        subtitle="Planificá la reposición y recibí mercadería en tu depósito."
      >
        <Button
          access="compras.crear"
          icon={I.Plus}
          onClick={() => setModal({ kind: "purchase" })}
        >
          Nueva orden de compra
        </Button>
      </PageTitle>
      <MiniStats
        items={[
          [
            "Órdenes pendientes",
            rows.filter((x) => x.state === "Pendiente").length,
            I.Clock,
            "orange",
          ],
          [
            "Compras recibidas",
            rows.filter((x) => x.state === "Recibida").length,
            I.Truck,
            "green",
          ],
          [
            "Total en órdenes",
            money(rows.reduce((a, x) => a + x.total, 0)),
            I.ShoppingCart,
            "blue",
          ],
        ]}
      />
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar orden o proveedor…"
        />
      </div>
      <Panel>
        <Table
          headers={[
            "Orden",
            "Fecha",
            "Proveedor",
            "Depósito",
            "Total",
            "Estado",
            "Acciones",
          ]}
          empty={!rows.length}
        >
          {rows.map((x) => (
            <tr key={x.id}>
              <td>
                <button
                  className="table-link"
                  onClick={() =>
                    setModal({ kind: "purchase-detail", id: x.id })
                  }
                >
                  {x.number}
                </button>
              </td>
              <td>{date(x.date)}</td>
              <td>{data.suppliers.find((s) => s.id === x.supplier)?.name}</td>
              <td>{x.warehouse}</td>
              <td>
                <b>{money(x.total)}</b>
              </td>
              <td>
                <Badge>{x.state}</Badge>
              </td>
              <td>
                {x.state === "Pendiente" ? (
                  <Button
                    access="compras.recibir"
                    variant="outline small"
                    icon={I.Truck}
                    onClick={() =>
                      act(
                        (s) => receivePurchase(s, x.id, user!.name),
                        "Compra recibida. Stock actualizado.",
                      )
                    }
                  >
                    Recibir mercadería
                  </Button>
                ) : (
                  <Button
                    variant="text"
                    onClick={() =>
                      setModal({ kind: "purchase-detail", id: x.id })
                    }
                  >
                    Ver detalle
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <div className="info-strip">
        <I.InfoCircle size={19} /> El stock se actualiza al recibir la
        mercadería, no al crear la orden de compra.
      </div>
    </>
  );
}
