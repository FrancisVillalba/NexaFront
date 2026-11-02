import * as I from "../../icons";
import { IconButton } from "../../components/ui";
import { money, date } from "../../services/formatters";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { Table } from "../../components/shared/Table";

// Listado de presupuestos.
export function Quotes() {
  const {
    data,
    setCart,
    setSaleClient,
    setSaleDiscount,
    setWarehouse,
    go,
    openSale,
    confirm,
    commit,
  } = useApp();
  return (
    <>
      <PageTitle
        title="Presupuestos"
        subtitle="Prepará una propuesta y convertíla en venta cuando tu cliente confirme."
      >
        <Button
          access="presupuestos.crear"
          icon={I.Plus}
          onClick={() => {
            setCart([]);
            setSaleClient("c1");
            setSaleDiscount(0);
            go("nuevo-presupuesto");
          }}
        >
          Nuevo presupuesto
        </Button>
      </PageTitle>
      <Panel>
        <Table
          headers={[
            "Número",
            "Fecha",
            "Cliente",
            "Productos",
            "Total",
            "Estado",
            "Acciones",
          ]}
          empty={!data.quotes.length}
        >
          {data.quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <b>{q.number}</b>
              </td>
              <td>{date(q.date)}</td>
              <td>{data.clients.find((c) => c.id === q.client)?.name}</td>
              <td>{q.items.length}</td>
              <td>{money(q.total)}</td>
              <td>
                <Badge>{q.state}</Badge>
              </td>
              <td>
                <div className="row-actions">
                  <Button
                    access={["presupuestos.convertir", "ventas.crear"]}
                    variant="outline small"
                    onClick={() => {
                      setCart(q.items.map((x) => ({ ...x })));
                      setSaleClient(q.client);
                      setSaleDiscount(q.discount);
                      setWarehouse(q.warehouse);
                      go("nueva-venta");
                    }}
                  >
                    Convertir en venta
                  </Button>
                  <IconButton
                    access="presupuestos.eliminar"
                    icon={I.Trash}
                    label={"Eliminar " + q.number}
                    onClick={() =>
                      confirm(
                        "Eliminar presupuesto",
                        "Se quitará este presupuesto de la maqueta.",
                        () => {
                          const s = structuredClone(data);
                          s.quotes = s.quotes.filter((x) => x.id !== q.id);
                          commit(s, "Presupuesto eliminado");
                        },
                      )
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <div className="info-strip">
        <I.InfoCircle size={19} /> Un presupuesto no reserva ni descuenta stock.
        Las cantidades se validan al confirmar la venta.
      </div>
    </>
  );
}
