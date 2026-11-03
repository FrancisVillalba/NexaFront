import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { useEffect, useRef, useState } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { comprasFecha, comprasMoneda, comprasServicio } from "./comprasServicio";
import type { Compra } from "./comprasTipos";

export function ComprasDetalle({ id, alCerrar, alCambiar }: { id: number; alCerrar: () => void; alCambiar: (mensaje: string) => void }) {
  const [compra, setCompra] = useState<Compra | null>(null), [cargando, setCargando] = useState(true);
  const [error, setError] = useState(""), [revision, setRevision] = useState(0), [ocupado, setOcupado] = useState(false);
  const pendiente = useRef(false);
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError(""); setCompra(null);
    comprasServicio.obtener(id, controlador.signal).then(datos => { if (!controlador.signal.aborted) setCompra(datos); })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar la compra."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [id, revision]);
  async function cambiar(accion: "recibir" | "cancelar") {
    if (!compra || pendiente.current) return;
    const mensaje = accion === "recibir" ? "¿Confirmás la recepción completa? Se sumarán las cantidades al inventario real." : "¿Querés cancelar esta compra pendiente? No se modificará el stock.";
    if (!window.confirm(mensaje)) return;
    pendiente.current = true; setOcupado(true); setError("");
    try { setCompra(await comprasServicio[accion](compra)); alCambiar(accion === "recibir" ? "Compra recibida. Inventario actualizado." : "Compra cancelada."); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo completar la operación."); }
    finally { pendiente.current = false; setOcupado(false); }
  }
  return <Modal title={compra ? `Compra ${compra.numero}` : "Detalle de compra"} onClose={() => { if (!pendiente.current) alCerrar(); }} wide>
    {cargando ? <p role="status">Cargando compra…</p> : compra && <>
      <p><b>{compra.proveedorNombre}</b> · {documentoTipoNombre(compra.proveedorTipoDocumento)} · {compra.proveedorDocumento || "Sin documento"}</p>
      <p>{compra.depositoNombre} · {comprasFecha(compra.creadoEn)}</p>
      <p>Estado: <b>{compra.estado}</b>{compra.recibidoEn && ` · Recibida: ${comprasFecha(compra.recibidoEn)}`}</p>
      {compra.observaciones && <p>{compra.observaciones}</p>}
      <div className="table-wrap mt"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Costo unitario</th><th>Importe</th><th>Movimiento</th></tr></thead><tbody>{compra.items.map(x => <tr key={x.id}>
        <td>{x.productoCodigo} · {x.productoNombre}</td><td>{x.cantidad} {x.unidadMedida}</td><td>{comprasMoneda(x.costoUnitario)}</td><td>{comprasMoneda(x.subtotal)}</td><td>{x.movimientoId ? `#${x.movimientoId}` : "—"}</td>
      </tr>)}</tbody></table></div>
      <div className="total"><span>Total</span><strong>{comprasMoneda(compra.total)}</strong></div>
      <p className="muted">Creado por usuario #{compra.creadoPor ?? "—"}{compra.modificadoEn && ` · Modificado por #${compra.modificadoPor ?? "—"} el ${comprasFecha(compra.modificadoEn)}`}</p>
      {compra.estado === "Pendiente" && <div className="modal-actions">
        <Button access="compras.cancelar" variant="danger-outline" disabled={ocupado} onClick={() => cambiar("cancelar")}>Cancelar compra</Button>
        <Button access="compras.recibir" disabled={ocupado} onClick={() => cambiar("recibir")}>{ocupado ? "Procesando…" : "Recibir mercadería"}</Button>
      </div>}
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><Button variant="secondary" disabled={ocupado || cargando} onClick={() => setRevision(x => x + 1)}>Actualizar detalle</Button><Button variant="secondary" disabled={ocupado} onClick={alCerrar}>Cerrar</Button></div>
  </Modal>;
}
