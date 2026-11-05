import { useEffect, useRef, useState } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { ventasMoneda } from "../ventas/ventasServicio";
import { presupuestosRespuestaIncierta, presupuestosServicio } from "./presupuestosServicio";
import type { Presupuesto, PresupuestoConversion, PresupuestoConvertirEntrada } from "./presupuestosTipos";

// Revisar no reserva stock: confirmar comprueba otra vez precios, versiones y existencias.
export function PresupuestosConversion({ presupuesto, alCerrar, alConvertir }: {
  presupuesto: Presupuesto; alCerrar: () => void; alConvertir: (ventaId: number) => void;
}) {
  const [datos, setDatos] = useState<PresupuestoConversion | null>(null), [cargando, setCargando] = useState(true);
  const [revision, setRevision] = useState(0), [error, setError] = useState(""), [revisado, setRevisado] = useState(false);
  const [ocupado, setOcupado] = useState(false), [incierta, setIncierta] = useState(false);
  const pendiente = useRef(false), solicitud = useRef<PresupuestoConvertirEntrada | null>(null);
  useEffect(() => {
    let vigente = true;
    setCargando(true); setError(""); setDatos(null); setRevisado(false); solicitud.current = null;
    presupuestosServicio.preparar(presupuesto.id).then(res => { if (vigente) setDatos(res); })
      .catch(fallo => { if (vigente) setError(fallo instanceof Error ? fallo.message : "No se pudo preparar la conversión."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [presupuesto.id, revision]);
  useEffect(() => {
    if (!incierta) return;
    const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", avisar); return () => window.removeEventListener("beforeunload", avisar);
  }, [incierta]);
  function cerrar() {
    if (pendiente.current) return;
    if (incierta && !window.confirm("La conversión pudo haberse confirmado. Reintentá para comprobarlo; si salís, revisá el presupuesto y su venta antes de crear otra. ¿Querés salir?")) return;
    alCerrar();
  }
  async function convertir() {
    if (!datos || !revisado || pendiente.current) return;
    solicitud.current ??= { operacionId: crypto.randomUUID(), version: datos.version,
      items: datos.cotizacion.items.map(x => ({ productoId: x.productoId, versionProducto: x.versionProducto })) };
    pendiente.current = true; setOcupado(true); setError("");
    try {
      const venta = await presupuestosServicio.convertir(presupuesto.id, solicitud.current);
      setIncierta(false); alConvertir(venta.id);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo convertir el presupuesto.");
      // Mantener UUID y contenido permite recuperar una respuesta perdida sin crear otra venta.
      setIncierta(presupuestosRespuestaIncierta(fallo));
    } finally { pendiente.current = false; setOcupado(false); }
  }
  const cambioPrecios = datos?.cotizacion.items.some(x => presupuesto.items.find(p => p.productoId === x.productoId)?.precioUnitario !== x.precioUnitario);
  return <Modal title={"Convertir " + presupuesto.numero + " en venta"} onClose={cerrar} wide>
    {cargando ? <p role="status">Consultando precios y stock actuales…</p> : datos && <>
      <p>{datos.cotizacion.clienteNombre} · {datos.cotizacion.depositoNombre}</p>
      {cambioPrecios && <p className="info-strip" role="status">Cambiaron precios desde el presupuesto. La venta usará los precios actuales mostrados a continuación.</p>}
      <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio presupuestado</th><th>Precio actual</th><th>Subtotal actual</th><th>Disponible</th></tr></thead>
        <tbody>{datos.cotizacion.items.map(x => <tr key={x.productoId}><td>{x.codigo} · {x.nombre}</td><td>{x.cantidad} {x.unidadMedida}</td>
          <td>{ventasMoneda(presupuesto.items.find(p => p.productoId === x.productoId)?.precioUnitario ?? 0)}</td><td>{ventasMoneda(x.precioUnitario)}</td><td>{ventasMoneda(x.subtotal)}</td><td>{x.disponible}</td></tr>)}</tbody></table></div>
      <p>Total presupuestado: {ventasMoneda(presupuesto.total)} · Descuento conservado: {ventasMoneda(datos.cotizacion.descuento)}</p>
      <div className="total"><span>Total de la venta a confirmar</span><strong>{ventasMoneda(datos.cotizacion.total)}</strong></div>
      <label className="mt"><input type="checkbox" checked={revisado} disabled={ocupado || incierta} onChange={e => setRevisado(e.target.checked)} /> Revisé los precios y el total de la venta.</label>
    </>}
    <p className="form-help">Confirmar genera una venta y descuenta stock. El presupuesto conserva sus importes originales. No registra cobros.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {incierta && <p role="status">No se recibió una respuesta definitiva. Reintentá la misma conversión para comprobarla.</p>}
    <div className="modal-actions"><Button variant="secondary" disabled={ocupado} onClick={cerrar}>Volver al presupuesto</Button>
      <Button variant="secondary" disabled={ocupado || incierta || cargando} onClick={() => setRevision(x => x + 1)}>Recalcular precios y stock</Button>
      <Button access={["presupuestos.convertir", "ventas.crear"]} disabled={ocupado || cargando || !datos || !revisado} onClick={convertir}>{ocupado ? "Procesando…" : incierta ? "Reintentar conversión" : "Confirmar venta"}</Button></div>
  </Modal>;
}
