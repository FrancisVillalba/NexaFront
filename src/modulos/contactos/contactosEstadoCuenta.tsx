import * as I from "../../icons";
import { Modal } from "../../components/ui";
import { money, date } from "../../services/formatters";
import { useApp } from "../../services/AppContext";
import { requireRecord } from "../../components/shared/helpers";
import { Button } from "../../components/shared/Button";
import { MiniStats } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";

// Consulta de cuenta corriente de un cliente.
export function Statement({ id }: { id: string }) {
  const { data, setModal, pay } = useApp();
  const c = requireRecord(
      data.clients.find((x) => x.id === id),
      "Cliente",
    ),
    rows = data.invoices.filter(
      (x) => x.client === id && x.state !== "Anulada",
    );
  return (
    <Modal
      title={"Cuenta corriente · " + c.name}
      onClose={() => setModal(null)}
      wide
    >
      <MiniStats
        items={[
          ["Límite de crédito", money(c.credit), I.ShieldCheck, "blue"],
          [
            "Saldo pendiente",
            money(rows.reduce((a, x) => a + x.total - x.paid, 0)),
            I.Clock,
            "orange",
          ],
        ]}
      />
      <Table
        headers={["Comprobante", "Fecha", "Total", "Cobrado", "Saldo", ""]}
        empty={!rows.length}
      >
        {rows.map((x) => (
          <tr key={x.id}>
            <td>{x.number}</td>
            <td>{date(x.date)}</td>
            <td>{money(x.total)}</td>
            <td>{money(x.paid)}</td>
            <td>{money(x.total - x.paid)}</td>
            <td>
              {x.total > x.paid && (
                <Button
                  access="ventas.cobrar"
                  variant="outline small"
                  onClick={() => pay(x)}
                >
                  Cobrar
                </Button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Modal>
  );
}
