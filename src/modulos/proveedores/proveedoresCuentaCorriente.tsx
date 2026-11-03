import { useEffect, useState } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { pagosFecha, pagosMedioNombre } from "../pagos/pagosServicio";
import { comprasFecha, comprasMoneda } from "../compras/comprasServicio";
import { ComprasDetalle } from "../compras/comprasDetalle";
import { proveedoresCuentaConsultar, proveedoresCuentaTamanoPagina } from "./proveedoresCuentaServicio";
import type { ProveedorCuenta } from "./proveedoresCuentaTipos";

export function ProveedoresCuentaCorriente({ proveedorId, alCerrar }: { proveedorId: number; alCerrar: () => void }) {
  const puede = useAccess();
  const [datos, setDatos] = useState<ProveedorCuenta | null>(null), [paginaCompras, setPaginaCompras] = useState(1), [paginaPagos, setPaginaPagos] = useState(1);
  const [revision, setRevision] = useState(0), [cargando, setCargando] = useState(true), [error, setError] = useState("");
  const [compraId, setCompraId] = useState<number | null>(null);
  // Compras y pagos tienen páginas independientes; los totales siempre vienen del backend.
  useEffect(() => {
    if (compraId !== null) return;
    const controlador = new AbortController();
    setCargando(true); setError(""); setDatos(null);
    proveedoresCuentaConsultar(proveedorId, paginaCompras, paginaPagos, controlador.signal).then(res => { if (!controlador.signal.aborted) setDatos(res); })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar la cuenta corriente."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [proveedorId, paginaCompras, paginaPagos, revision, compraId]);
  if (compraId !== null) return <ComprasDetalle id={compraId} alCerrar={() => { setCompraId(null); setRevision(x => x + 1); }} alCambiar={() => setRevision(x => x + 1)} />;
  const paginasCompras = Math.max(1, Math.ceil((datos?.totalRegistrosCompras ?? 0) / proveedoresCuentaTamanoPagina));
  const paginasPagos = Math.max(1, Math.ceil((datos?.totalRegistrosPagos ?? 0) / proveedoresCuentaTamanoPagina));
  return <Modal title="Cuenta corriente del proveedor" onClose={alCerrar} wide>
    {cargando ? <p role="status">Cargando cuenta corriente…</p> : error ? <p className="form-error" role="alert">{error}</p> : datos && <>
      <h3>{datos.proveedorNombre}</h3><p>{documentoTipoNombre(datos.tipoDocumento)} {datos.documento}{!datos.activo && " · Proveedor inactivo"}</p>
      <div className="info-strip">Compras recibidas: {comprasMoneda(datos.totalCompras)} · Pagos vigentes: {comprasMoneda(datos.totalPagos)} · <b>Saldo pendiente: {comprasMoneda(datos.saldo)}</b></div>
      <h3 className="mt">Compras y saldos</h3><div className="table-wrap"><table><thead><tr><th>Compra</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Acciones</th></tr></thead><tbody>{datos.compras.map(x => <tr key={x.id}>
        <td>{x.numero}</td><td>{comprasFecha(x.fecha)}</td><td>{x.estado}<small className="block">{x.estadoPago}</small></td><td>{comprasMoneda(x.total)}</td><td>{comprasMoneda(x.pagado)}</td><td>{comprasMoneda(x.saldo)}</td>
        <td>{puede("compras.ver") && <Button variant="outline small" onClick={() => setCompraId(x.id)}>Ver compra y pagos</Button>}</td>
      </tr>)}</tbody></table>{!datos.compras.length && <p className="empty">El proveedor no tiene compras.</p>}</div>
      <div className="pagination"><small>Compras: página {paginaCompras} de {paginasCompras}</small><div><Button variant="secondary" disabled={paginaCompras === 1} onClick={() => setPaginaCompras(x => x - 1)}>Compras anteriores</Button><Button variant="secondary" disabled={paginaCompras >= paginasCompras} onClick={() => setPaginaCompras(x => x + 1)}>Compras siguientes</Button></div></div>
      <h3 className="mt">Historial de pagos</h3><div className="table-wrap"><table><thead><tr><th>Pago / compra</th><th>Fecha</th><th>Medio</th><th>Importe</th><th>Estado / auditoría</th></tr></thead><tbody>{datos.pagos.map(x => <tr key={x.id}>
        <td>{x.numero}<small className="block">{x.compraNumero} · {x.referencia || "Sin referencia"}</small>{x.observaciones && <small className="block">{x.observaciones}</small>}</td><td>{pagosFecha(x.fechaPago)}</td><td>{pagosMedioNombre(x.medioPago)}</td><td>{comprasMoneda(x.importe)}</td>
        <td>{x.estado}<small className="block">Usuario #{x.creadoPor ?? "—"} · {comprasFecha(x.creadoEn)}</small>{x.anuladoEn && <small className="block">Anulado por #{x.modificadoPor ?? "—"} · {comprasFecha(x.anuladoEn)} · {x.motivoAnulacion}</small>}</td>
      </tr>)}</tbody></table>{!datos.pagos.length && <p className="empty">No hay pagos registrados.</p>}</div>
      <div className="pagination"><small>Pagos: página {paginaPagos} de {paginasPagos}</small><div><Button variant="secondary" disabled={paginaPagos === 1} onClick={() => setPaginaPagos(x => x - 1)}>Pagos anteriores</Button><Button variant="secondary" disabled={paginaPagos >= paginasPagos} onClick={() => setPaginaPagos(x => x + 1)}>Pagos siguientes</Button></div></div>
      <p className="form-help">Las compras pendientes o canceladas y los pagos anulados se conservan en el historial, pero no generan saldo pendiente.</p>
    </>}
    <div className="modal-actions"><Button variant="secondary" disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar cuenta</Button><Button variant="secondary" onClick={alCerrar}>Cerrar</Button></div>
  </Modal>;
}
