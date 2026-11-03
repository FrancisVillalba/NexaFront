import { useEffect, useState } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { cobrosFecha, cobrosMedioNombre } from "../cobros/cobrosServicio";
import { ventasFecha, ventasMoneda } from "../ventas/ventasServicio";
import { VentasDetalle } from "../ventas/ventasDetalle";
import { clientesCuentaConsultar, clientesCuentaTamanoPagina } from "./clientesCuentaServicio";
import type { ClienteCuenta } from "./clientesCuentaTipos";

export function ClientesCuentaCorriente({ clienteId, alCerrar }: { clienteId: number; alCerrar: () => void }) {
  const puede = useAccess();
  const [datos, setDatos] = useState<ClienteCuenta | null>(null), [paginaVentas, setPaginaVentas] = useState(1), [paginaCobros, setPaginaCobros] = useState(1);
  const [revision, setRevision] = useState(0), [cargando, setCargando] = useState(true), [error, setError] = useState("");
  const [ventaId, setVentaId] = useState<number | null>(null);
  useEffect(() => {
    if (ventaId !== null) return;
    const controlador = new AbortController();
    setCargando(true); setError("");
    clientesCuentaConsultar(clienteId, paginaVentas, paginaCobros, controlador.signal).then(res => { if (!controlador.signal.aborted) setDatos(res); })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar la cuenta corriente."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [clienteId, paginaVentas, paginaCobros, revision, ventaId]);
  if (ventaId !== null) return <VentasDetalle id={ventaId} alCerrar={() => { setVentaId(null); setRevision(x => x + 1); }} alCambiar={() => setRevision(x => x + 1)} />;
  const paginasVentas = Math.max(1, Math.ceil((datos?.totalRegistrosVentas ?? 0) / clientesCuentaTamanoPagina));
  const paginasCobros = Math.max(1, Math.ceil((datos?.totalRegistrosCobros ?? 0) / clientesCuentaTamanoPagina));
  return <Modal title="Cuenta corriente del cliente" onClose={alCerrar} wide>
    {cargando ? <p role="status">Cargando cuenta corriente…</p> : error ? <p className="form-error" role="alert">{error}</p> : datos && <>
      <h3>{datos.clienteNombre}</h3><p>{documentoTipoNombre(datos.tipoDocumento)} {datos.documento}{!datos.activo && " · Cliente inactivo"}</p>
      <div className="info-strip">Ventas confirmadas: {ventasMoneda(datos.totalVentas)} · Cobros vigentes: {ventasMoneda(datos.totalCobros)} · <b>Saldo pendiente: {ventasMoneda(datos.saldo)}</b></div>
      <h3 className="mt">Ventas y saldos</h3><div className="table-wrap"><table><thead><tr><th>Venta</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Cobrado</th><th>Saldo</th><th>Acciones</th></tr></thead><tbody>{datos.ventas.map(x => <tr key={x.id}>
        <td>{x.numero}</td><td>{ventasFecha(x.fecha)}</td><td>{x.estado}<small className="block">{x.estadoCobro}</small></td><td>{ventasMoneda(x.total)}</td><td>{ventasMoneda(x.cobrado)}</td><td>{ventasMoneda(x.saldo)}</td>
        <td>{puede("ventas.ver") && <Button variant="outline small" onClick={() => setVentaId(x.id)}>Ver venta y cobros</Button>}</td>
      </tr>)}</tbody></table>{!datos.ventas.length && <p className="empty">El cliente no tiene ventas.</p>}</div>
      <div className="pagination"><small>Ventas: página {paginaVentas} de {paginasVentas}</small><div><Button variant="secondary" disabled={paginaVentas === 1} onClick={() => setPaginaVentas(x => x - 1)}>Ventas anteriores</Button><Button variant="secondary" disabled={paginaVentas >= paginasVentas} onClick={() => setPaginaVentas(x => x + 1)}>Ventas siguientes</Button></div></div>
      <h3 className="mt">Historial de cobros</h3><div className="table-wrap"><table><thead><tr><th>Cobro / venta</th><th>Fecha</th><th>Medio</th><th>Importe</th><th>Estado / auditoría</th></tr></thead><tbody>{datos.cobros.map(x => <tr key={x.id}>
        <td>{x.numero}<small className="block">{x.ventaNumero} · {x.referencia || "Sin referencia"}</small>{x.observaciones && <small className="block">{x.observaciones}</small>}</td><td>{cobrosFecha(x.fechaCobro)}</td><td>{cobrosMedioNombre(x.medioPago)}</td><td>{ventasMoneda(x.importe)}</td>
        <td>{x.estado}<small className="block">Usuario #{x.creadoPor ?? "—"} · {ventasFecha(x.creadoEn)}</small>{x.anuladoEn && <small className="block">Anulado por #{x.modificadoPor ?? "—"} · {ventasFecha(x.anuladoEn)} · {x.motivoAnulacion}</small>}</td>
      </tr>)}</tbody></table>{!datos.cobros.length && <p className="empty">No hay cobros registrados.</p>}</div>
      <div className="pagination"><small>Cobros: página {paginaCobros} de {paginasCobros}</small><div><Button variant="secondary" disabled={paginaCobros === 1} onClick={() => setPaginaCobros(x => x - 1)}>Cobros anteriores</Button><Button variant="secondary" disabled={paginaCobros >= paginasCobros} onClick={() => setPaginaCobros(x => x + 1)}>Cobros siguientes</Button></div></div>
      <p className="form-help">Las ventas anuladas y los cobros anulados se conservan en el historial, pero no generan saldo pendiente.</p>
    </>}
    <div className="modal-actions"><Button variant="secondary" disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar cuenta</Button><Button variant="secondary" onClick={alCerrar}>Cerrar</Button></div>
  </Modal>;
}
