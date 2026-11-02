import { useState } from "react";
import * as I from "../../icons";
import { Field } from "../../components/ui";
import { date } from "../../services/formatters";
import { seed } from "../../services/demoData";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { Table } from "../../components/shared/Table";

// Configuración de la demostración.
export function Settings() {
  const { data, commit, confirm } = useApp();
  const [v, setV] = useState({ ...data.settings });
  return (
    <>
      <PageTitle
        title="Configuración"
        subtitle="La información y preferencias de tu ferretería."
      />
      <div className="settings-layout">
        <Panel title="Datos del negocio" icon={I.BuildingStore}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{3}-\d{3}$/.test(v.prefix)) return;
              const s = structuredClone(data);
              s.settings = v;
              commit(s, "Configuración guardada");
            }}
          >
            <div className="form-grid">
              {[
                ["company", "Nombre del negocio"],
                ["doc", "RUC / documento"],
                ["address", "Dirección"],
                ["phone", "Teléfono"],
                ["email", "Correo electrónico"],
                ["prefix", "Serie de comprobantes"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  type={key === "email" ? "email" : "text"}
                  required
                  value={String(v[key as keyof typeof v])}
                  pattern={key === "prefix" ? "[0-9]{3}-[0-9]{3}" : undefined}
                  title={key === "prefix" ? "Formato: 001-001" : undefined}
                  onChange={(e) => setV({ ...v, [key]: e.target.value })}
                />
              ))}
            </div>
            <div className="modal-actions">
              <Button type="submit" icon={I.Check}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title="Acerca de esta maqueta" icon={I.InfoCircle}>
          <p>
            Un espacio para probar el funcionamiento de tu ferretería con datos
            de ejemplo.
          </p>
          <dl>
            <div>
              <dt>Moneda</dt>
              <dd>Guaraníes (Gs.)</dd>
            </div>
            <div>
              <dt>Depósitos</dt>
              <dd>Casa central y Norte</dd>
            </div>
            <div>
              <dt>Comprobantes</dt>
              <dd>Demostrativos</dd>
            </div>
          </dl>
          <p className="muted">
            Los cambios comerciales se guardan en este navegador. El login y los
            usuarios se consultan en NexaBack con PostgreSQL.
          </p>
          <Button
            access="configuracion.restablecer"
            variant="danger-outline"
            icon={I.Refresh}
            onClick={() =>
              confirm(
                "Restablecer datos de ejemplo",
                "Se reemplazarán los productos, ventas y movimientos de esta maqueta por los datos iniciales. Esta acción no modifica ningún sistema real.",
                () => {
                  const s = seed();
                  commit(s, "Datos de ejemplo restablecidos");
                  setV(s.settings);
                },
              )
            }
          >
            Restablecer demostración
          </Button>
        </Panel>
      </div>
      <Panel title="Actividad reciente" className="mt">
        <Table
          headers={["Fecha", "Usuario", "Acción"]}
          empty={!data.audit.length}
        >
          {data.audit.slice(0, 12).map((x) => (
            <tr key={x.id}>
              <td>{date(x.date)}</td>
              <td>{x.user}</td>
              <td>{x.action}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
