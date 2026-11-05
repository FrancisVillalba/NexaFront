import { useEffect, useRef, useState } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { ventasFecha, ventasMoneda } from "../ventas/ventasServicio";
import { VentasDetalle } from "../ventas/ventasDetalle";
import { PresupuestosEdicion } from "./presupuestosEdicion";
import { PresupuestosConversion } from "./presupuestosConversion";
import { presupuestosRespuestaIncierta, presupuestosFecha, presupuestosServicio } from "./presupuestosServicio";
import type { Presupuesto } from "./presupuestosTipos";

type Accion = { tipo: "aprobar"; datos: Presupuesto } | { tipo: "cancelar"; datos: Presupuesto; motivo: string };
export function PresupuestosDetalle({ id, alCerrar, alCambiar }: { id: number; alCerrar: () => void; alCambiar: (mensaje: string) => void; }) {
  const puede = useAccess();
  const [datos, setDatos] = useState<Presupuesto | null>(null), [cargando, setCargando] = useState(true), [revision, setRevision] = useState(0);
  const [error, setError] = useState(""), [aviso, setAviso] = useState(""), [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false), [incierta, setIncierta] = useState(false);
  const [pantalla, setPantalla] = useState<"detalle" | "editar" | "convertir">("detalle"), [ventaId, setVentaId] = useState<number | null>(null);
  const pendiente = useRef(false), accion = useRef<Accion | null>(null);
  const bloqueado = ocupado || incierta;
  useEffect(() => {
    if (pantalla !== "detalle" || ventaId !== null) return;
    const controlador = new AbortController();
    setCargando(true); setError(""); setDatos(null);
    presupuestosServicio.obtener(id, controlador.signal).then(res => { if (!controlador.signal.aborted) setDatos(res); })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar el presupuesto."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [id, revision, pantalla, ventaId]);
  useEffect(() => {
    if (!incierta) return;
    const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", avisar); return () => window.removeEventListener("beforeunload", avisar);
  }, [incierta]);
  function cerrar() {
    if (pendiente.current) return;
    if (incierta && !window.confirm("No se recibió una respuesta definitiva. Reintentá para comprobarla o revisá el estado al volver a abrir. ¿Querés salir?")) return;
    alCerrar();
  }
  function actualizado(mensaje: string) { setAviso(mensaje); alCambiar(mensaje); setRevision(x => x + 1); }
  async function ejecutar(actual: Accion) {
    if (pendiente.current) return;
    pendiente.current = true; accion.current = actual; setOcupado(true); setError("");
    try {
      if (actual.tipo === "aprobar") await presupuestosServicio.aprobar(actual.datos);
      else await presupuestosServicio.cancelar(actual.datos, actual.motivo);
      setIncierta(false); setMotivo(""); actualizado(actual.tipo === "aprobar" ? "Presupuesto aprobado." : "Presupuesto cancelado.");
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo completar la operación.");
      setIncierta(presupuestosRespuestaIncierta(fallo));
    } finally { pendiente.current = false; setOcupado(false); }
  }
  // Desmontar el modal anterior evita superponer el editor, la conversión y el detalle.
  if (ventaId !== null) return <VentasDetalle id={ventaId} alCerrar={() => setVentaId(null)} alCambiar={actualizado} />;
  if (datos && pantalla === "editar") return <PresupuestosEdicion presupuesto={datos} alCerrar={() => setPantalla("detalle")} alGuardar={() => { actualizado("Presupuesto actualizado."); setPantalla("detalle"); }} />;
  if (datos && pantalla === "convertir") return <PresupuestosConversion presupuesto={datos} alCerrar={() => setPantalla("detalle")}
    alConvertir={venta => { actualizado("Venta VTA-" + String(venta).padStart(6, "0") + " generada desde el presupuesto."); setPantalla("detalle"); }} />;
  return <Modal title={datos ? datos.numero : "Detalle del presupuesto"} onClose={cerrar} wide>
    {aviso && <p className="info-strip" role="status">{aviso}</p>}
    {cargando ? <p role="status">Cargando presupuesto…</p> : datos && <>
      <p><b>{datos.clienteNombre}</b> · {documentoTipoNombre(datos.clienteTipoDocumento)} {datos.clienteDocumento}</p>
      <p>{datos.depositoNombre} · {ventasFecha(datos.creadoEn)} · <b>{datos.estado}{datos.vencido && " · Vencido"}</b></p>
      <p>Vencimiento: <b>{presupuestosFecha(datos.fechaVencimiento)}</b> (válido hasta ese día inclusive)</p>
      {datos.observaciones && <p>{datos.observaciones}</p>}
      <div className="table-wrap mt"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio presupuestado</th><th>Subtotal</th></tr></thead><tbody>{datos.items.map(x => <tr key={x.id}>
        <td>{x.productoCodigo} · {x.productoNombre}</td><td>{x.cantidad} {x.unidadMedida}</td><td>{ventasMoneda(x.precioUnitario)}</td><td>{ventasMoneda(x.subtotal)}</td></tr>)}</tbody></table></div>
      <p>Subtotal: {ventasMoneda(datos.subtotal)} · Descuento: {ventasMoneda(datos.descuento)}</p>
      <div className="total"><span>Total presupuestado</span><strong>{ventasMoneda(datos.total)}</strong></div>
      <p className="muted">Creado por #{datos.creadoPor ?? "—"}{datos.modificadoEn && " · Modificado por #" + (datos.modificadoPor ?? "—") + " el " + ventasFecha(datos.modificadoEn)}</p>
      {datos.aprobadoEn && <p>Aprobado por #{datos.aprobadoPor ?? "—"} el {ventasFecha(datos.aprobadoEn)}</p>}
      {datos.canceladoEn && <p>Cancelado el {ventasFecha(datos.canceladoEn)} · Motivo: {datos.motivoCancelacion}</p>}
      {datos.ventaId !== null && <p>Venta asociada: <b>VTA-{String(datos.ventaId).padStart(6, "0")}</b> {puede("ventas.ver") && <Button variant="outline small" disabled={bloqueado} onClick={() => setVentaId(datos.ventaId)}>Ver venta</Button>}</p>}
      {datos.estado === "Borrador" && <div className="modal-actions">
        <Button access="presupuestos.editar" variant="secondary" disabled={bloqueado} onClick={() => setPantalla("editar")}>Editar borrador</Button>
        <Button access="presupuestos.aprobar" disabled={bloqueado || datos.vencido} onClick={() => { if (window.confirm("¿Aprobás este presupuesto? Sus datos ya no podrán editarse.")) ejecutar({ tipo: "aprobar", datos }); }}>Aprobar presupuesto</Button>
      </div>}
      {datos.estado === "Aprobado" && <div className="modal-actions"><Button access={["presupuestos.convertir", "ventas.crear"]} disabled={bloqueado || datos.vencido} onClick={() => setPantalla("convertir")}>Revisar y convertir en venta</Button></div>}
      {(datos.estado === "Borrador" || datos.estado === "Aprobado") && puede("presupuestos.cancelar") && <div className="mt">
        <Field label="Motivo de cancelación" required maxLength={300} value={motivo} disabled={bloqueado} onChange={e => setMotivo(e.target.value)} />
        <Button variant="danger-outline" disabled={bloqueado || !motivo.trim()} onClick={() => { if (window.confirm("¿Querés cancelar el presupuesto? Se conservará su historial.")) ejecutar({ tipo: "cancelar", datos, motivo: motivo.trim() }); }}>Cancelar presupuesto</Button>
      </div>}
      <p className="form-help">Este presupuesto no reserva ni descuenta stock. Los importes históricos se conservan al convertirlo en venta.</p>
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {incierta && <Button disabled={ocupado} onClick={() => { if (accion.current) ejecutar(accion.current); }}>Reintentar operación</Button>}
    <div className="modal-actions"><Button variant="secondary" disabled={bloqueado || cargando} onClick={() => setRevision(x => x + 1)}>Actualizar detalle</Button><Button variant="secondary" disabled={ocupado} onClick={cerrar}>Cerrar</Button></div>
  </Modal>;
}
