import { ReportesVentasDias, ReportesCategorias } from "./reportesGraficos";
import { useEffect, useRef, useState } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import { ReportesTabla } from "./reportesTabla";
import { reportesDescargar } from "./reportesColumnas";
import { reportesFechaHora, reportesHoy, reportesMoneda, reportesOpciones, reportesServicio, reportesUsaPeriodo } from "./reportesServicio";
import type { Reporte, ReporteConsulta, ReporteDeposito } from "./reportesTipos";

// Cada respuesta incluye sus totales; el navegador no suma una página como si fuera todo el reporte.
export function Reports() {
  const puede = useAccess();
  const opciones = reportesOpciones.filter(x => puede(x.permiso));
  const permisos = opciones.map(x => x.tipo).join("|");
  const hoy = reportesHoy();
  const [consulta, setConsulta] = useState<ReporteConsulta>({ tipo: opciones[0]?.tipo ?? "ventas", desde: hoy.slice(0, 8) + "01", hasta: hoy, depositoId: null, pagina: 1 });
  const [datos, setDatos] = useState<Reporte | null>(null), [depositos, setDepositos] = useState<ReporteDeposito[]>([]);
  const [revision, setRevision] = useState(0), [cargando, setCargando] = useState(true), [error, setError] = useState(""), [errorDepositos, setErrorDepositos] = useState("");
  const [exportando, setExportando] = useState(false), [errorExportacion, setErrorExportacion] = useState("");
  const exportacionPendiente = useRef(false);
  useEffect(() => {
    const controlador = new AbortController();
    setErrorDepositos("");
    reportesServicio.depositos(controlador.signal).then(res => { if (!controlador.signal.aborted) setDepositos(res); })
      .catch(fallo => { if (!controlador.signal.aborted) setErrorDepositos(fallo instanceof Error ? fallo.message : "No se pudieron consultar depósitos."); });
    return () => controlador.abort();
  }, [revision]);
  useEffect(() => {
    const controlador = new AbortController();
    setDatos(null); setError(""); setErrorExportacion("");
    if (!opciones.some(x => x.tipo === consulta.tipo)) {
      setCargando(false);
      if (opciones[0]) setConsulta(q => ({ ...q, tipo: opciones[0].tipo, pagina: 1 }));
      return () => controlador.abort();
    }
    if (reportesUsaPeriodo(consulta.tipo) && (!consulta.desde || !consulta.hasta || consulta.desde > consulta.hasta)) {
      setCargando(false); setError("Revisá las fechas: Desde debe ser anterior o igual a Hasta."); return () => controlador.abort();
    }
    setCargando(true);
    reportesServicio.consultar(consulta, controlador.signal).then(res => {
      if (controlador.signal.aborted) return;
      const ultima = Math.max(1, Math.ceil(res.resumen.registros / res.tamanoPagina));
      if (consulta.pagina > ultima) setConsulta(q => ({ ...q, pagina: ultima })); else setDatos(res);
    }).catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar el reporte."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
    // permisos es una firma estable de las secciones habilitadas por el token.
  }, [consulta, revision, permisos]);
  async function exportar() {
    if (!datos || cargando || exportacionPendiente.current) return;
    exportacionPendiente.current = true; setExportando(true); setErrorExportacion("");
    try { reportesDescargar(await reportesServicio.exportar(consulta)); }
    catch (fallo) { setErrorExportacion(fallo instanceof Error ? fallo.message : "No se pudo exportar el reporte."); }
    finally { exportacionPendiente.current = false; setExportando(false); }
  }
  const periodo = reportesUsaPeriodo(consulta.tipo);
  const saldos = ["ventas", "compras", "por-cobrar", "por-pagar"].includes(consulta.tipo);
  const paginas = Math.max(1, Math.ceil((datos?.resumen.registros ?? 0) / (datos?.tamanoPagina ?? 20)));
  return <>
    <div className="page-title"><div><h1>Reportes</h1><p>Operaciones reales y saldos actuales, calculados por el backend.</p></div><div className="page-actions">
      <Button variant="secondary" disabled={cargando || exportando} onClick={() => setRevision(x => x + 1)}>Actualizar</Button>
      <Button access="reportes.exportar" disabled={!datos || cargando || exportando} onClick={exportar}>{exportando ? "Exportando…" : "Exportar CSV completo"}</Button>
      <Button access="reportes.exportar" variant="secondary" disabled={!datos || cargando || exportando} onClick={() => window.print()}>Imprimir página</Button>
    </div></div>
    <fieldset className="filter-bar" disabled={exportando} style={{ minWidth: 0 }}>
      <Field label="Reporte"><select value={consulta.tipo} onChange={e => { const opcion = opciones.find(x => x.tipo === e.target.value); if (opcion) setConsulta(q => ({ ...q, tipo: opcion.tipo, pagina: 1 })); }}>{opciones.map(x => <option key={x.tipo} value={x.tipo}>{x.nombre}</option>)}</select></Field>
      <Field label="Depósito"><select value={consulta.depositoId ?? ""} onChange={e => setConsulta(q => ({ ...q, depositoId: e.target.value ? Number(e.target.value) : null, pagina: 1 }))}><option value="">Todos los depósitos</option>{depositos.map(x => <option key={x.id} value={x.id}>{x.nombre}{!x.activo && " (inactivo)"}</option>)}</select></Field>
      <Field label="Desde" required={periodo} type="date" disabled={!periodo} value={consulta.desde} onChange={e => setConsulta(q => ({ ...q, desde: e.target.value, pagina: 1 }))} />
      <Field label="Hasta" required={periodo} type="date" disabled={!periodo} value={consulta.hasta} onChange={e => setConsulta(q => ({ ...q, hasta: e.target.value, pagina: 1 }))} />
    </fieldset>
    {errorDepositos && <p className="form-error" role="alert">{errorDepositos} <Button variant="secondary" onClick={() => setRevision(x => x + 1)}>Reintentar depósitos</Button></p>}
    {errorExportacion && <p className="form-error" role="alert">{errorExportacion}</p>}
    {!opciones.length ? <p className="info-strip">Tu perfil no tiene permisos para las secciones de este reporte.</p>
      : error ? <p className="form-error" role="alert">{error}</p> : cargando ? <p role="status">Consultando reporte…</p> : datos && <>
      <p>{datos.depositoNombre} · Consultado: {reportesFechaHora(datos.generadoEn)} · {datos.usaPeriodo ? datos.desde + " al " + datos.hasta : "Situación actual de todos los períodos"}</p>
      <div className="info-strip">Registros: <b>{datos.resumen.registros}</b> · {consulta.tipo === "inventario" ? "Valorización al costo actual" : "Importe"}: <b>{reportesMoneda(datos.resumen.importe)}</b>
        {saldos && <> · Aplicado actual: <b>{reportesMoneda(datos.resumen.aplicado)}</b> · Saldo actual: <b>{reportesMoneda(datos.resumen.saldo)}</b></>}</div>
      {datos.ventas && <section className="panel mt"><h3>Análisis de ventas del período</h3>
        <p>Costo histórico: {reportesMoneda(datos.ventas.costo)} · Margen bruto estimado: {reportesMoneda(datos.ventas.margenEstimado)} · Ticket promedio: {reportesMoneda(datos.ventas.ticketPromedio)}</p>
        <p className="form-help">Margen = ventas netas menos costo histórico de sus líneas. No incluye gastos operativos ni impuestos desglosados.</p>
        <h3>Ventas por día</h3><ReportesVentasDias dias={datos.ventas.dias} desde={datos.desde} hasta={datos.hasta} />
        <h3>Productos más vendidos por importe bruto</h3><div className="table-wrap"><table><thead><tr><th>Producto histórico</th><th>Cantidad</th><th>Venta bruta sin descuento general</th></tr></thead><tbody>
          {datos.ventas.productos.map((x, indice) => <tr key={indice}><td>{x.codigo} · {x.nombre}</td><td>{x.cantidad} {x.unidad}</td><td>{reportesMoneda(x.bruto)}</td></tr>)}
        </tbody></table>{!datos.ventas.productos.length && <p className="empty">No hay ventas en el período.</p>}</div>
      </section>}
      {datos.tipo === "inventario" && <section className="panel mt"><h3>Inventario por categoría</h3><ReportesCategorias categorias={datos.categorias} /></section>}
      <section className="panel"><ReportesTabla tipo={datos.tipo} filas={datos.items} />
        <div className="pagination"><small>Página {consulta.pagina} de {paginas} · {datos.resumen.registros} registros</small><div>
          <Button variant="secondary" disabled={exportando || consulta.pagina === 1} onClick={() => setConsulta(q => ({ ...q, pagina: q.pagina - 1 }))}>Anterior</Button>
          <Button variant="secondary" disabled={exportando || consulta.pagina >= paginas} onClick={() => setConsulta(q => ({ ...q, pagina: q.pagina + 1 }))}>Siguiente</Button>
        </div></div>
      </section>
    </>}
    <p className="form-help">{periodo ? "Solo operaciones vigentes al consultar. Ventas usa la fecha de creación; compras, la recepción; cobros y pagos, su fecha indicada. Los importes aplicados y saldos son actuales, aunque el pago sea de otro período." : "El inventario y las cuentas pendientes muestran su situación actual, no un cierre histórico. Los depósitos y contactos inactivos conservan sus saldos."} El CSV incluye todas las filas de la consulta, hasta 10.000, con una nueva instantánea de datos.</p>
  </>;
}
