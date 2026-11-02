import * as I from "../../icons";
import { Modal } from "../../components/ui";
import { money, num, date } from "../../services/formatters";
import { receivePurchase } from "./comprasServicio";
import { useApp } from "../../services/AppContext";
import { requireRecord } from "../../components/shared/helpers";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { Table } from "../../components/shared/Table";

// Detalle de una compra existente.
export function PurchaseDetail({ id }: { id: string }) {
  const { data, setModal, act, user } = useApp();
  const p = requireRecord(
    data.purchases.find((x) => x.id === id),
    "Compra",
  );
  return (
    <Modal title={"Orden " + p.number} onClose={() => setModal(null)} wide>
      <p>
        {data.suppliers.find((x) => x.id === p.supplier)?.name} · {p.warehouse}{" "}
        · {date(p.date)}
      </p>
      <Badge>{p.state}</Badge>
      <Table headers={["Producto", "Cantidad", "Costo unitario", "Importe"]}>
        {p.items.map((x) => (
          <tr key={x.productId}>
            <td>{x.name}</td>
            <td>{num(x.qty)}</td>
            <td>{money(x.cost)}</td>
            <td>{money(x.qty * x.cost)}</td>
          </tr>
        ))}
      </Table>
      <div className="total">
        <span>Total</span>
        <strong>{money(p.total)}</strong>
      </div>
      <div className="modal-actions">
        {p.state === "Pendiente" && (
          <Button
            access="compras.recibir"
            icon={I.Truck}
            onClick={() => {
              if (
                act(
                  (s) => receivePurchase(s, p.id, user!.name),
                  "Compra recibida. Stock actualizado.",
                )
              )
                setModal(null);
            }}
          >
            Recibir mercadería
          </Button>
        )}
      </div>
    </Modal>
  );
}
