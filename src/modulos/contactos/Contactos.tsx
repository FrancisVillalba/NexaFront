import { useState } from "react";
import * as I from "../../icons";
import { IconButton } from "../../components/ui";
import { money, csv } from "../../services/formatters";
import { useApp } from "../../services/AppContext";
import { Button } from "../../components/shared/Button";
import { Search } from "../../components/shared/Search";
import { PageTitle } from "../../components/shared/PageTitle";
import { Panel } from "../../components/shared/Panel";
import { Table } from "../../components/shared/Table";

// Pantalla compartida para clientes y proveedores.
export function Contacts({ type }: { type: string }) {
  const { data, contactForm, setModal } = useApp();
  const [q, setQ] = useState(""),
    clients = type === "clientes",
    rows = data[clients ? "clients" : "suppliers"].filter((c) =>
      (c.name + " " + c.doc + " " + c.phone)
        .toLowerCase()
        .includes(q.toLowerCase()),
    );
  const debt = (id: string) =>
    data.invoices
      .filter((x) => x.client === id && x.state !== "Anulada")
      .reduce((a, x) => a + x.total - x.paid, 0);
  return (
    <>
      <PageTitle
        title={clients ? "Clientes" : "Proveedores"}
        subtitle={
          clients
            ? "Tus contactos, límites de crédito y cuentas corrientes."
            : "Toda la información de quienes abastecen tu ferretería."
        }
      >
        <Button
          access={`${type}.crear`}
          icon={I.Plus}
          onClick={() => contactForm(type)}
        >
          Nuevo {clients ? "cliente" : "proveedor"}
        </Button>
      </PageTitle>
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar por nombre, documento o teléfono…"
        />
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              type + ".csv",
              ["Nombre", "Documento", "Teléfono", "Correo", "Dirección"],
              rows.map((x) => [x.name, x.doc, x.phone, x.email, x.address]),
            )
          }
        >
          Exportar
        </Button>
      </div>
      <Panel>
        <Table
          headers={[
            "Nombre / razón social",
            "Documento",
            "Contacto",
            clients ? "Límite de crédito" : "Dirección",
            ...(clients ? ["Saldo pendiente"] : []),
            "Acciones",
          ]}
          empty={!rows.length}
        >
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="contact-name">
                  <span className="contact-avatar">{c.name[0]}</span>
                  <b>{c.name}</b>
                </div>
              </td>
              <td>{c.doc}</td>
              <td>
                {c.phone || "—"}
                <small className="block">{c.email}</small>
              </td>
              <td>{clients ? money(c.credit) : c.address}</td>
              {clients && (
                <td className={debt(c.id) > 0 ? "danger-text" : ""}>
                  {money(debt(c.id))}
                </td>
              )}
              <td>
                <div className="row-actions">
                  {clients && (
                    <Button
                      access="clientes.cuenta_corriente"
                      variant="text"
                      onClick={() => setModal({ kind: "statement", id: c.id })}
                    >
                      Cuenta corriente
                    </Button>
                  )}
                  {c.id !== "c1" && (
                    <IconButton
                      access={`${type}.editar`}
                      icon={I.Edit}
                      label={"Editar " + c.name}
                      onClick={() => contactForm(type, c)}
                    />
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
