import { ReportesVentasDias, ReportesCategorias } from "../reportes/reportesGraficos";
import { useEffect, useState } from "react";
import * as I from "../../icons";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { Stat } from "../../components/shared/Stats";
import { useApp } from "../../services/AppContext";
import { useAccess } from "../../services/AccessContext";
import { VentasDetalle } from "../ventas/ventasDetalle";
import { ReportesTabla } from "../reportes/reportesTabla";
import { reportesRestarDias, reportesFechaHora, reportesMoneda, reportesNumero } from "../reportes/reportesServicio";
import type { InicioResumen, ReporteDeposito } from "../reportes/reportesTipos";
import { inicioServicio } from "./inicioServicio";

export function Dashboard() {
  const { go, openSale } = useApp();
  const puede = useAccess();
  const permisos = ["ventas.ver", "compras.ver", "inventario.ver", "clientes.cuenta_corriente", "proveedores.cuenta_corriente"].filter(puede).join("|");
  const [depositoId, setDepositoId] = useState<number | null>(null), [depositos, setDepositos] = useState<ReporteDeposito[]>([]);
  const [datos, setDatos] = useState<InicioResumen | null>(null), [cargando, setCargando] = useState(true);
  const [error, setError] = useState(""), [errorDepositos, setErrorDepositos] = useState(""), [revision, setRevision] = useState(0);
  const [ventaId, setVentaId] = useState<number | null>(null);
  useEffect(() => {
    const controlador = new AbortController();
    setErrorDepositos("");
    inicioServicio.depositos(controlador.signal).then(res => { if (!controlador.signal.aborted) setDepositos(res); })
      .catch(fallo => { if (!controlador.signal.aborted) setErrorDepositos(fallo instanceof Error ? fallo.message : "No se pudieron consultar depósitos."); });
    return () => controlador.abort();
  }, [revision]);
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError(""); setDatos(null);
    inicioServicio.consultar(depositoId, controlador.signal).then(res => { if (!controlador.signal.aborted) setDatos(res); })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar el resumen."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [depositoId, revision, permisos]);
  useEffect(() => {
    const actualizar = () => setRevision(x => x + 1);
    window.addEventListener("focus", actualizar); return () => window.removeEventListener("focus", actualizar);
  }, []);
  return <>
    <div className="page-title"><div><h1>Resumen del negocio</h1><p>Ventas, compras, cobros, pagos e inventario reales.</p></div><div className="page-actions">
      <Button variant="secondary" disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar</Button>
      <Button access="ventas.crear" variant="green" icon={I.Plus} onClick={openSale}>Nueva venta</Button>
    </div></div>
    <div className="filter-bar"><Field label="Depósito"><select value={depositoId ?? ""} onChange={e => setDepositoId(e.target.value ? Number(e.target.value) : null)}><option value="">Todos los depósitos</option>
      {depositos.map(x => <option key={x.id} value={x.id}>{x.nombre}{!x.activo && " (inactivo)"}</option>)}</select></Field></div>
    {errorDepositos && <p className="form-error" role="alert">{errorDepositos} <Button variant="secondary" onClick={() => setRevision(x => x + 1)}>Reintentar depósitos</Button></p>}
    {error ? <p className="form-error" role="alert">{error}</p> : cargando ? <p role="status">Consultando el resumen del negocio…</p> : datos && <>
      <p>{datos.depositoNombre} · Consultado: {reportesFechaHora(datos.generadoEn)} · Mes: {datos.desde} al {datos.hasta}</p>
      {!datos.indicadores.length && <p className="info-strip">Tu perfil no tiene permisos para consultar las secciones comerciales del resumen.</p>}
      <div className="stats-grid">{datos.indicadores.map(x => <Stat key={x.codigo} label={x.nombre}
        value={x.codigo === "stock-bajo" ? reportesNumero(x.valor) : reportesMoneda(x.valor)} note={x.nota + " · " + x.cantidad + " registros"}
        icon={x.codigo === "stock-bajo" ? I.AlertTriangle : I.ChartBar} color={x.codigo === "stock-bajo" ? "orange" : "blue"}
        onClick={puede(x.ruta + ".ver") ? () => go(x.ruta) : undefined} />)}</div>
      {puede("ventas.ver") && <section className="panel mt"><h3>Últimas ventas confirmadas · todos los períodos</h3>
        <div className="table-wrap"><table><thead><tr><th>Venta</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Saldo actual</th><th>Acciones</th></tr></thead><tbody>
          {datos.ultimasVentas.map(x => <tr key={x.id}><td>{x.referencia}</td><td>{x.fecha && reportesFechaHora(x.fecha)}</td><td>{x.nombre}</td><td>{reportesMoneda(x.importe)}</td><td>{reportesMoneda(x.saldo)}</td>
            <td><Button variant="outline small" onClick={() => setVentaId(x.id)}>Ver venta</Button></td></tr>)}
        </tbody></table>{!datos.ultimasVentas.length && <p className="empty">No hay ventas confirmadas.</p>}</div>
      </section>}
      {puede("inventario.ver") && <section className="panel mt"><h3>Productos activos con stock bajo · hasta 6 productos</h3>
        <p className="muted">Stock menor o igual al mínimo. Con todos los depósitos se suma el stock por producto, incluidos los depósitos inactivos.</p>
        <ReportesTabla tipo="inventario" filas={datos.stockBajo} />
      </section>}
      {puede("ventas.ver") && <section className="panel mt"><h3>Ventas de los últimos 7 días</h3><ReportesVentasDias dias={datos.ventasSemana} desde={reportesRestarDias(datos.hasta, 6)} hasta={datos.hasta} /></section>}
      {puede("inventario.ver") && <section className="panel mt"><h3>Composición del inventario por categoría</h3><ReportesCategorias categorias={datos.categorias} /></section>}
      <p className="form-help">Ventas, compras, cobros y pagos muestran las operaciones vigentes del mes. Inventario y cuentas pendientes muestran saldos actuales de todos los períodos. No representa un cierre contable ni movimientos de Caja.</p>
    </>}
    {ventaId !== null && puede("ventas.ver") && <VentasDetalle id={ventaId} alCerrar={() => setVentaId(null)} alCambiar={() => setRevision(x => x + 1)} />}
  </>;
}
