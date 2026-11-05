import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import * as I from "../../icons";
import { ventasFecha, ventasMoneda } from "../ventas/ventasServicio";
import { presupuestosFecha, presupuestosEsFiltro, presupuestosEstados, presupuestosServicio, presupuestosTamanoPagina } from "./presupuestosServicio";
import { PresupuestosEdicion } from "./presupuestosEdicion";
import { PresupuestosDetalle } from "./presupuestosDetalle";
import { useAccess } from "../../services/AccessContext";
import type { PresupuestoFiltro, PresupuestosPagina } from "./presupuestosTipos";

export function PresupuestosListado() {
  const puede = useAccess();
  const [consulta, setConsulta] = useState<{ pagina: number; buscar: string; estado: PresupuestoFiltro | "" }>({ pagina: 1, buscar: "", estado: "" });
  const [buscar, setBuscar] = useState(""), [revision, setRevision] = useState(0);
  const [datos, setDatos] = useState<PresupuestosPagina>({ items: [], total: 0, pagina: 1, tamanoPagina: presupuestosTamanoPagina });
  const [cargando, setCargando] = useState(true), [error, setError] = useState(""), [aviso, setAviso] = useState("");
  const [dialogo, setDialogo] = useState<"nueva" | number | null>(null);
  const paginas = Math.max(1, Math.ceil(datos.total / presupuestosTamanoPagina));
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError("");
    presupuestosServicio.listar(consulta.pagina, consulta.buscar, consulta.estado, controlador.signal).then(resultado => {
      if (controlador.signal.aborted) return;
      const ultima = Math.max(1, Math.ceil(resultado.total / presupuestosTamanoPagina));
      if (consulta.pagina > ultima) setConsulta(anterior => ({ ...anterior, pagina: ultima })); else setDatos(resultado);
    }).catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron consultar los presupuestos."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [consulta, revision]);
  function filtrar(evento: SubmitEvent<HTMLFormElement>) { evento.preventDefault(); setConsulta(anterior => ({ ...anterior, pagina: 1, buscar: buscar.trim() })); }
  function actualizar(mensaje: string) { setAviso(mensaje); setRevision(x => x + 1); }
  return <>
    <div className="page-title"><div><h1>Presupuestos</h1><p>Propuestas reales, vencimientos y conversiones a venta.</p></div><div className="page-actions">
      <Button variant="secondary" icon={I.Refresh} disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar</Button>
      <Button access="presupuestos.crear" icon={I.Plus} onClick={() => setDialogo("nueva")}>Nuevo presupuesto</Button>
    </div></div>
    {aviso && <p className="info-strip" role="status">{aviso}</p>}
    <form className="filter-bar" onSubmit={filtrar}>
      <div className="search"><I.Search size={19}/><input aria-label="Buscar presupuestos" placeholder="Presupuesto, cliente o documento…" maxLength={200} value={buscar} onChange={e => setBuscar(e.target.value)} /></div><Button type="submit" variant="secondary">Buscar</Button>
      <Field label="Estado"><select value={consulta.estado} onChange={e => { const estado = e.target.value; if (presupuestosEsFiltro(estado)) setConsulta(anterior => ({ ...anterior, pagina: 1, estado })); }}><option value="">Todos</option>{presupuestosEstados.map(x => <option key={x}>{x}</option>)}</select></Field>
    </form>
    <section className="panel" aria-label="Listado de presupuestos" aria-busy={cargando}>
      {error ? <div className="form-error" role="alert"><p>{error}</p><Button onClick={() => setRevision(x => x + 1)}>Reintentar</Button></div> : cargando ? <p className="empty" role="status">Cargando presupuestos…</p> : <>
        <div className="table-wrap"><table><thead><tr><th>Presupuesto</th><th>Creación / vencimiento</th><th>Cliente</th><th>Depósito</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{datos.items.map(x => <tr key={x.id}>
          <td><b>{x.numero}</b></td><td>{ventasFecha(x.creadoEn)}<small className="block">Vence: {presupuestosFecha(x.fechaVencimiento)}</small></td><td>{x.clienteNombre}<small className="block">{documentoTipoNombre(x.clienteTipoDocumento)} · {x.clienteDocumento}</small></td><td>{x.depositoNombre}</td><td>{ventasMoneda(x.total)}</td>
          <td><span className={`badge ${x.estado === "Convertido" ? "green" : "gray"}`}>{x.estado}{x.vencido && " · Vencido"}</span></td>
          <td><Button variant="outline small" onClick={() => setDialogo(x.id)}>Ver detalle</Button></td>
        </tr>)}</tbody></table>{!datos.items.length && <p className="empty">No hay presupuestos para los filtros seleccionados.</p>}</div>
        <div className="pagination"><small>Página {consulta.pagina} de {paginas} · {datos.total} presupuestos</small><div><Button variant="secondary" disabled={consulta.pagina === 1} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina - 1 }))}>Anterior</Button><Button variant="secondary" disabled={consulta.pagina >= paginas} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina + 1 }))}>Siguiente</Button></div></div>
      </>}
    </section>
    <p className="info-strip">Un presupuesto no reserva stock. Su conversión genera una venta real después de revisar precios y existencias.</p>
    {dialogo === "nueva" && puede("presupuestos.crear") && <PresupuestosEdicion alCerrar={() => setDialogo(null)} alGuardar={id => { actualizar("Presupuesto guardado."); setDialogo(id); }} />}
    {typeof dialogo === "number" && <PresupuestosDetalle id={dialogo} alCerrar={() => setDialogo(null)} alCambiar={actualizar} />}
  </>;
}
