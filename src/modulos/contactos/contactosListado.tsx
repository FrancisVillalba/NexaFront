import { ProveedoresCuentaCorriente } from "../proveedores/proveedoresCuentaCorriente";
import { ClientesCuentaCorriente } from "../clientes/clientesCuentaCorriente";
import { documentoTipoNombre } from "./contactosDocumentos";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import * as I from "../../icons";
import { contactosTamanoPagina } from "./contactosServicio";
import { ContactosEdicion } from "./contactosEdicion";
import { ContactosEstado } from "./contactosEstado";
import type { ContactoComercial, ContactosConsulta, ContactosPagina, ContactosServicio } from "./contactosTipos";

type Dialogo = { tipo: "cuenta"; contactoId: number } | { tipo: "edicion"; contacto: ContactoComercial | null } | { tipo: "estado"; contacto: ContactoComercial };
const moneda = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 });

export function ContactosListado({ servicio }: { servicio: ContactosServicio }) {
  const puede = useAccess();
  const cliente = servicio.tipo === "clientes";
  const titulo = cliente ? "Clientes" : "Proveedores", singular = cliente ? "cliente" : "proveedor";
  const [consulta, setConsulta] = useState<ContactosConsulta>({ pagina: 1, buscar: "", activo: "todos" });
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState<ContactosPagina>({ items: [], total: 0, pagina: 1, tamanoPagina: contactosTamanoPagina });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [revision, setRevision] = useState(0);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const paginas = Math.max(1, Math.ceil(datos.total / contactosTamanoPagina));

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError("");
    servicio.listar(consulta, controlador.signal).then(resultado => {
      if (controlador.signal.aborted) return;
      const ultima = Math.max(1, Math.ceil(resultado.total / contactosTamanoPagina));
      if (consulta.pagina > ultima) setConsulta(anterior => ({ ...anterior, pagina: ultima }));
      else setDatos(resultado);
    }).catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar el listado."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [consulta, revision, servicio]);

  function buscar(evento: SubmitEvent<HTMLFormElement>) { evento.preventDefault(); setConsulta(anterior => ({ ...anterior, pagina: 1, buscar: busqueda.trim() })); }
  function actualizar(mensaje: string) { setDialogo(null); setAviso(mensaje); setRevision(x => x + 1); }

  return (
    <>
      <div className="page-title"><div><h1>{titulo}</h1><p>Particulares y empresas con datos propios de este módulo.</p></div><div className="page-actions">
        <Button variant="secondary" icon={I.Refresh} disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar</Button>
        <Button access={`${servicio.tipo}.crear`} icon={I.Plus} onClick={() => { setAviso(""); setDialogo({ tipo: "edicion", contacto: null }); }}>Nuevo {singular}</Button>
      </div></div>
      {aviso && <p className="info-strip" role="status">{aviso}</p>}
      <form className="filter-bar" onSubmit={buscar}>
        <div className="search"><I.Search size={19} /><input aria-label={`Buscar ${servicio.tipo}`} placeholder="Nombre o razón social, documento / RUC, correo o teléfono…" maxLength={200} value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
        <Button type="submit" variant="secondary">Buscar</Button>
        <Field label="Estado"><select value={consulta.activo} onChange={e => { const activo = e.target.value;
          if (activo === "todos" || activo === "true" || activo === "false") setConsulta(anterior => ({ ...anterior, pagina: 1, activo }));
        }}><option value="todos">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></Field>
      </form>
      <section className="panel" aria-label={`Listado de ${servicio.tipo}`} aria-busy={cargando}>
        {error ? <div className="form-error" role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setRevision(x => x + 1)}>Reintentar</Button></div>
          : cargando ? <p className="empty" role="status">Cargando {servicio.tipo}…</p> : <>
          <div className="table-wrap"><table>
            <thead><tr><th>{cliente ? "Cliente" : "Proveedor"}</th><th>Contacto</th><th>Condiciones</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>{datos.items.map(contacto => <tr key={contacto.id}>
              <td><b>{contacto.nombreRazonSocial}</b><small className="block">{documentoTipoNombre(contacto.tipoDocumento)} · {contacto.documento || "Sin documento"}</small></td>
              <td>{contacto.correo || "—"}<small className="block">{contacto.telefono || "—"}</small><small className="block">{contacto.direccion || "—"}</small></td>
              <td>{contacto.plazoPagoDias} días{cliente && <small className="block">Límite: Gs. {moneda.format(contacto.limiteCredito)}</small>}</td>
              <td><span className={`badge ${contacto.activo ? "green" : "gray"}`}>{contacto.activo ? "Activo" : "Inactivo"}</span></td>
              <td><div className="row-actions">
                <Button access={`${servicio.tipo}.editar`} variant="outline small productos-accion" icon={I.Edit} aria-label={`Editar ${contacto.nombreRazonSocial}`} onClick={() => { setAviso(""); setDialogo({ tipo: "edicion", contacto }); }}>Editar</Button>
                <Button access={`${servicio.tipo}.estado`} variant={`${contacto.activo ? "danger-outline" : "outline"} small productos-accion`} 
                  
                  aria-label={`${contacto.activo ? "Desactivar" : "Activar"} ${contacto.nombreRazonSocial}`} onClick={() => { setAviso(""); setDialogo({ tipo: "estado", contacto }); }}>{contacto.activo ? "Desactivar" : "Activar"}</Button>
                <Button access={servicio.tipo + ".cuenta_corriente"} variant="outline small" aria-label={"Cuenta corriente de " + contacto.nombreRazonSocial} onClick={() => setDialogo({ tipo: "cuenta", contactoId: contacto.id })}>Cuenta corriente</Button>
                {!puede(`${servicio.tipo}.editar`) && !puede(`${servicio.tipo}.estado`) && <small>Solo consulta</small>}
              </div></td>
            </tr>)}</tbody>
          </table>{!datos.items.length && <p className="empty">No hay {servicio.tipo} para los filtros seleccionados.</p>}</div>
          <div className="pagination"><small>Página {consulta.pagina} de {paginas} · {datos.total} registros</small><div>
            <Button variant="secondary" disabled={consulta.pagina === 1} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina - 1 }))}>Anterior</Button>
            <Button variant="secondary" disabled={consulta.pagina >= paginas} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina + 1 }))}>Siguiente</Button>
          </div></div>
        </>}
      </section>
      {dialogo?.tipo === "cuenta" && cliente && puede("clientes.cuenta_corriente") && <ClientesCuentaCorriente clienteId={dialogo.contactoId} alCerrar={() => setDialogo(null)} />}
      {dialogo?.tipo === "cuenta" && !cliente && puede("proveedores.cuenta_corriente") && <ProveedoresCuentaCorriente proveedorId={dialogo.contactoId} alCerrar={() => setDialogo(null)} />}
      {dialogo?.tipo === "edicion" && puede(`${servicio.tipo}.${dialogo.contacto ? "editar" : "crear"}`) && <ContactosEdicion servicio={servicio} contacto={dialogo.contacto} alCerrar={() => setDialogo(null)} alGuardar={() => actualizar(dialogo.contacto ? "Registro actualizado." : `${cliente ? "Cliente creado" : "Proveedor creado"}.`)} />}
      {dialogo?.tipo === "estado" && puede(`${servicio.tipo}.estado`) && <ContactosEstado servicio={servicio} contacto={dialogo.contacto} alCerrar={() => setDialogo(null)} alGuardar={() => actualizar(dialogo.contacto.activo ? "Registro desactivado." : "Registro activado.")} />}
    </>
  );
}
