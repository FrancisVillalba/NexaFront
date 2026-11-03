import { CobrosVenta } from "../cobros/cobrosVenta";
import { useAccess } from "../../services/AccessContext";
import { useEffect, useRef, useState } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { ventasFecha, ventasMoneda, ventasServicio } from "./ventasServicio";
import type { Venta } from "./ventasTipos";

export function VentasDetalle({ id, alCerrar, alCambiar }: { id: number; alCerrar: () => void; alCambiar: (mensaje: string) => void }) {
  const puede = useAccess();
  const [venta, setVenta] = useState<Venta | null>(null), [cargando, setCargando] = useState(true);
  const [error, setError] = useState(""), [revision, setRevision] = useState(0), [motivo, setMotivo] = useState("");
  const [anulando, setOcupado] = useState(false);
  const [cobroOcupado, setCobroOcupado] = useState(false), [cobroIncierto, setCobroIncierto] = useState(false);
  const [totalCobrado, setTotalCobrado] = useState<number | null>(null);
  const ocupado = anulando || cobroOcupado;
  const pendiente = useRef(false);
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError(""); setVenta(null); setTotalCobrado(null);
    ventasServicio.obtener(id, controlador.signal).then(datos => { if (!controlador.signal.aborted) setVenta(datos); })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar la venta."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [id, revision]);
  function cerrar() {
    if (pendiente.current || cobroOcupado) return;
    if (cobroIncierto && !window.confirm("No se recibió una respuesta definitiva del cobro. Reintentá para comprobarlo; si salís, revisá el historial antes de registrar otro. ¿Querés salir?")) return;
    alCerrar();
  }
  async function anular() {
    if (!venta || pendiente.current || cobroOcupado || cobroIncierto || totalCobrado === null || totalCobrado > 0) return;
    if (!motivo.trim()) { setError("Escribí el motivo de anulación."); return; }
    if (!window.confirm("¿Confirmás la anulación? Se devolverán todos los productos al depósito original.")) return;
    pendiente.current = true; setOcupado(true); setError("");
    try { setVenta(await ventasServicio.anular(venta, motivo.trim())); alCambiar("Venta anulada. Existencias devueltas al depósito original."); setRevision(x => x + 1); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo anular la venta."); }
    finally { pendiente.current = false; setOcupado(false); }
  }
  return <Modal title={venta ? "Venta " + venta.numero : "Detalle de venta"} onClose={cerrar} wide>
    {cargando ? <p role="status">Cargando venta…</p> : venta && <>
      <p><b>{venta.clienteNombre}</b> · {documentoTipoNombre(venta.clienteTipoDocumento)} {venta.clienteDocumento}</p>
      <p>{venta.depositoNombre} · {ventasFecha(venta.creadoEn)} · <b>{venta.estado}</b></p>
      {venta.observaciones && <p>{venta.observaciones}</p>}
      <div className="table-wrap mt"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th>Movimientos</th></tr></thead><tbody>{venta.items.map(x => <tr key={x.id}>
        <td>{x.productoCodigo} · {x.productoNombre}</td><td>{x.cantidad} {x.unidadMedida}</td><td>{ventasMoneda(x.precioUnitario)}</td><td>{ventasMoneda(x.subtotal)}</td><td>Salida #{x.movimientoSalidaId}{x.movimientoAnulacionId && <small className="block">Devolución #{x.movimientoAnulacionId}</small>}</td>
      </tr>)}</tbody></table></div>
      <p>Subtotal: {ventasMoneda(venta.subtotal)} · Descuento: {ventasMoneda(venta.descuento)}</p>
      <div className="total"><span>Total</span><strong>{ventasMoneda(venta.total)}</strong></div>
      <p className="muted">Creado por usuario #{venta.creadoPor ?? "—"}{venta.modificadoEn && " · Modificado por #" + (venta.modificadoPor ?? "—") + " el " + ventasFecha(venta.modificadoEn)}</p>
      <p className="form-help">Comprobante interno sin validez fiscal. Los pagos se registran en Cobros.</p>
      <CobrosVenta ventaId={venta.id} alResumen={setTotalCobrado} alOcupado={setCobroOcupado} alIncierta={setCobroIncierto}
        alCambiar={mensaje => { alCambiar(mensaje); setRevision(x => x + 1); }} />
      {totalCobrado !== null && totalCobrado > 0 && venta.estado === "Confirmada" && <p className="form-help">Para anular esta venta, primero anulá sus cobros vigentes.</p>}
      {venta.anuladaEn && <p>Venta anulada el {ventasFecha(venta.anuladaEn)} · Motivo: {venta.motivoAnulacion}</p>}
      {venta.estado === "Confirmada" && puede("ventas.anular") && <div className="mt"><Field label="Motivo de anulación" required maxLength={300} disabled={ocupado || cobroIncierto} value={motivo} onChange={e => setMotivo(e.target.value)} />
        <Button access="ventas.anular" variant="danger-outline" disabled={ocupado || cobroIncierto || totalCobrado === null || totalCobrado > 0 || !motivo.trim()} onClick={anular}>{ocupado ? "Procesando…" : "Anular y devolver stock"}</Button></div>}
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><Button variant="secondary" disabled={ocupado || cobroIncierto || cargando} onClick={() => setRevision(x => x + 1)}>Actualizar detalle</Button><Button variant="secondary" disabled={ocupado} onClick={cerrar}>Cerrar</Button></div>
  </Modal>;
}
