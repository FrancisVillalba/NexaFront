import * as I from "../../icons";
import { Brand, Modal } from "../../components/ui";
import { money, num, date } from "../../services/formatters";
import { voidInvoice } from "./ventasServicio";
import { useApp } from "../../services/AppContext";
import { requireRecord } from "../../components/shared/helpers";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { Table } from "../../components/shared/Table";

// Detalle de una venta.
export function InvoiceModal({ id }: { id: string }) {
  const { can } = useApp();
  const { data, user, setModal, pay, confirm, act } = useApp();
  const inv = requireRecord(
      data.invoices.find((x) => x.id === id),
      "Factura",
    ),
    client = requireRecord(
      data.clients.find((c) => c.id === inv.client),
      "Cliente",
    );
  return (
    <Modal
      title="Comprobante de venta"
      onClose={() => setModal(null)}
      wide
      className="receipt-modal"
    >
      <div className="receipt print-area">
        <div className="receipt-head">
          <div>
            <Brand dark />
            <h3>{data.settings.company}</h3>
            <p>
              {data.settings.doc}
              <br />
              {data.settings.address}
              <br />
              {data.settings.phone}
            </p>
          </div>
          <div>
            <span className="demo-receipt">COMPROBANTE DEMOSTRATIVO</span>
            <h2>{inv.number}</h2>
            <p>
              {date(inv.date)} · {inv.warehouse}
            </p>
            <Badge>{inv.state}</Badge>
          </div>
        </div>
        <div className="receipt-client">
          <b>Cliente: {client.name}</b>
          <span>RUC / documento: {client.doc}</span>
          <span>Forma de pago: {inv.payment}</span>
        </div>
        <Table headers={["Descripción", "Cantidad", "Precio", "Importe"]}>
          {inv.items.map((x) => (
            <tr key={x.productId}>
              <td>{x.name}</td>
              <td>
                {num(x.qty)} {x.unit}
              </td>
              <td>{money(x.price)}</td>
              <td>{money(x.qty * x.price)}</td>
            </tr>
          ))}
        </Table>
        <div className="receipt-totals">
          <span>
            Descuento <b>{money(inv.discount)}</b>
          </span>
          <strong>
            Total <b>{money(inv.total)}</b>
          </strong>
          <span>
            Cobrado <b>{money(inv.paid)}</b>
          </span>
          <span>
            Saldo pendiente{" "}
            <b>{inv.state === "Anulada" ? "—" : money(inv.total - inv.paid)}</b>
          </span>
        </div>
        <p className="receipt-note">Documento de muestra sin validez fiscal.</p>
      </div>
      <div className="modal-actions wrap">
        <Button
          variant="secondary"
          icon={I.Printer}
          onClick={() => window.print()}
        >
          Imprimir / PDF
        </Button>
        {inv.state !== "Anulada" && inv.total > inv.paid && (
          <Button access="ventas.cobrar" icon={I.Cash} onClick={() => pay(inv)}>
            Registrar cobro
          </Button>
        )}
        {inv.state !== "Anulada" && can("ventas.anular") && (
          <Button
            access="ventas.anular"
            variant="danger-outline"
            icon={I.ArrowBackUp}
            onClick={() =>
              confirm(
                "Anular venta",
                "Se devolverán los productos al stock y se registrará el reintegro de lo cobrado en la caja de demostración.",
                () => {
                  if (
                    !act(
                      (s) => voidInvoice(s, id, user!.name),
                      "Venta anulada y stock devuelto",
                    )
                  )
                    throw Error(
                      "No se pudo anular. Revisá el estado de la caja.",
                    );
                },
              )
            }
          >
            Anular venta
          </Button>
        )}
      </div>
    </Modal>
  );
}
