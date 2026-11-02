import * as I from "../../icons";
import { TODAY } from "../../services/commercialConfig";
import { uid } from "../../services/commercialValidation";
import { money, date, csv } from "../../services/formatters";
import { cashExpected } from "./cajaServicio";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { MiniStats } from "../../components/shared/Stats";
import { Table } from "../../components/shared/Table";

// Componente existente de caja, sin agregarlo a la navegación.
export function Cash() {
  const { data, commit, form, confirm } = useApp(),
    cash = data.cash,
    expected = cashExpected(cash);
  function open() {
    form(
      "Abrir caja",
      [
        {
          name: "amount",
          label: "Fondo inicial en efectivo (Gs.)",
          type: "number",
          min: 0,
        },
      ],
      { amount: 0 },
      (v) => {
        const s = structuredClone(data);
        s.cash = {
          ...s.cash,
          open: true,
          opening: Number(v.amount),
          entries: [],
          openedAt: TODAY,
        };
        commit(s, "Caja abierta");
      },
    );
  }
  function entry() {
    form(
      "Registrar movimiento de caja",
      [
        { name: "type", label: "Tipo", options: ["Ingreso", "Egreso"] },
        { name: "amount", label: "Importe (Gs.)", type: "number", min: 1 },
        {
          name: "method",
          label: "Forma de pago",
          options: ["Efectivo", "Transferencia", "Tarjeta"],
        },
        { name: "reason", label: "Concepto" },
      ],
      { type: "Egreso", method: "Efectivo", amount: "", reason: "" },
      (v) => {
        if (
          v.type === "Egreso" &&
          v.method === "Efectivo" &&
          Number(v.amount) > expected
        )
          throw Error("El egreso supera el efectivo disponible.");
        const s = structuredClone(data);
        s.cash.entries.unshift({
          type: String(v.type ?? ""),
          reason: String(v.reason ?? ""),
          method: String(v.method ?? ""),
          amount: Number(v.amount),
          id: uid(),
          date: TODAY,
        });
        commit(s, "Movimiento de caja registrado");
      },
    );
  }
  function close() {
    form(
      "Cerrar caja",
      [
        {
          name: "counted",
          label: "Efectivo contado (Gs.)",
          type: "number",
          min: 0,
        },
      ],
      { counted: expected },
      (v) => {
        const s = structuredClone(data);
        s.cash.history.unshift({
          id: uid(),
          date: TODAY,
          opening: cash.opening,
          expected,
          counted: Number(v.counted),
          difference: Number(v.counted) - expected,
        });
        s.cash.open = false;
        commit(s, "Caja cerrada. Arqueo guardado.");
      },
      "Efectivo esperado: " +
        money(expected) +
        ". Se guardará cualquier diferencia de arqueo.",
      "Confirmar cierre",
    );
  }
  return (
    <>
      <PageTitle
        title="Caja"
        subtitle="Seguí tus cobros, gastos y el efectivo disponible."
      >
        {cash.open ? (
          <>
            <Button variant="secondary" icon={I.Plus} onClick={entry}>
              Movimiento de caja
            </Button>
            <Button icon={I.Lock} onClick={close}>
              Cerrar caja
            </Button>
          </>
        ) : (
          <Button icon={I.Plus} variant="green" onClick={open}>
            Abrir caja
          </Button>
        )}
      </PageTitle>
      <div className="cash-status">
        <Badge>{cash.open ? "Activa" : "Inactiva"}</Badge>
        <span>
          {cash.open
            ? "Caja abierta · " + date(cash.openedAt)
            : "Caja cerrada · Abrila para registrar cobros."}
        </span>
      </div>
      <MiniStats
        items={[
          ["Fondo inicial", money(cash.opening), I.Wallet, "blue"],
          [
            "Ingresos",
            money(
              cash.entries
                .filter((e) => e.type === "Ingreso")
                .reduce((a, x) => a + x.amount, 0),
            ),
            I.ArrowUp,
            "green",
          ],
          [
            "Egresos",
            money(
              cash.entries
                .filter((e) => e.type === "Egreso")
                .reduce((a, x) => a + x.amount, 0),
            ),
            I.ArrowDown,
            "red",
          ],
          ["Efectivo esperado", money(expected), I.Cash, "purple"],
        ]}
      />
      <Panel
        title="Movimientos del turno"
        action={
          <Button
            variant="text"
            icon={I.Download}
            onClick={() =>
              csv(
                "caja.csv",
                ["Fecha", "Tipo", "Concepto", "Medio", "Importe"],
                cash.entries.map((x) => [
                  x.date,
                  x.type,
                  x.reason,
                  x.method,
                  x.amount,
                ]),
              )
            }
          >
            Exportar
          </Button>
        }
      >
        <Table
          headers={["Fecha", "Concepto", "Tipo", "Medio de pago", "Importe"]}
          empty={!cash.entries.length}
        >
          {cash.entries.map((x) => (
            <tr key={x.id}>
              <td>{date(x.date)}</td>
              <td>{x.reason}</td>
              <td>
                <Badge>{x.type}</Badge>
              </td>
              <td>{x.method}</td>
              <td
                className={
                  x.type === "Ingreso" ? "success-text" : "danger-text"
                }
              >
                <b>
                  {x.type === "Ingreso" ? "+" : "−"} {money(x.amount)}
                </b>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      {cash.history.length > 0 && (
        <Panel title="Historial de cierres" className="mt">
          <Table
            headers={[
              "Fecha",
              "Fondo inicial",
              "Esperado",
              "Contado",
              "Diferencia",
            ]}
          >
            {cash.history.map((x) => (
              <tr key={x.id}>
                <td>{date(x.date)}</td>
                <td>{money(x.opening)}</td>
                <td>{money(x.expected)}</td>
                <td>{money(x.counted)}</td>
                <td>{money(x.difference)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </>
  );
}
