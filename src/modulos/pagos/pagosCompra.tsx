import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import { ApiError } from "../../services/api";
import { comprasFecha, comprasMoneda } from "../compras/comprasServicio";
import { pagosFecha, pagosFechaHoy, pagosMedioNombre, pagosMedios, pagosServicio, pagosTamanoPagina, esMedioPago } from "./pagosServicio";
import type { Pago, PagoEntrada, MedioPago, CompraPagos } from "./pagosTipos";

type Accion = { tipo: "registrar"; datos: PagoEntrada } | { tipo: "anular"; pagoId: number; version: string; motivo: string };
interface Props { compraId: number; alCambiar: (mensaje: string) => void; alOcupado: (valor: boolean) => void; alIncierta: (valor: boolean) => void; }

export function PagosCompra({ compraId, alCambiar, alOcupado, alIncierta }: Props) {
  const puede = useAccess();
  const [datos, setDatos] = useState<CompraPagos | null>(null), [pagina, setPagina] = useState(1), [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true), [error, setError] = useState(""), [ocupado, setOcupado] = useState(false), [incierta, setIncierta] = useState(false);
  const [importe, setImporte] = useState(""), [fecha, setFecha] = useState(pagosFechaHoy), [medio, setMedio] = useState<MedioPago | "">("");
  const [referencia, setReferencia] = useState(""), [observaciones, setObservaciones] = useState("");
  const [seleccionado, setSeleccionado] = useState<Pago | null>(null), [motivo, setMotivo] = useState("");
  const pendiente = useRef(false), accionActual = useRef<Accion | null>(null);
  const intentoRegistro = useRef<{ contenido: string; datos: PagoEntrada } | null>(null);
  const bloqueado = ocupado || incierta;
  // Consultamos el saldo real: no se calcula con importes guardados en el navegador.
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError(""); setDatos(null); setSeleccionado(null);
    pagosServicio.listar(compraId, pagina, controlador.signal).then(res => { if (!controlador.signal.aborted) { setDatos(res); } })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron consultar los pagos."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [compraId, pagina, revision]);
  useEffect(() => {
    if (!incierta) return;
    const avisar = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = ""; };
    window.addEventListener("beforeunload", avisar); return () => window.removeEventListener("beforeunload", avisar);
  }, [incierta]);

  async function ejecutar(accion: Accion) {
    if (pendiente.current) return;
    pendiente.current = true; accionActual.current = accion; setOcupado(true); alOcupado(true); setError("");
    try {
      if (accion.tipo === "registrar") await pagosServicio.registrar(compraId, accion.datos);
      else await pagosServicio.anular(compraId, accion.pagoId, accion.version, accion.motivo);
      setIncierta(false); alIncierta(false); setSeleccionado(null); setImporte(""); setMotivo(""); intentoRegistro.current = null;
      alCambiar(accion.tipo === "registrar" ? "Pago registrado. Saldo actualizado." : "Pago anulado. Saldo actualizado.");
      setRevision(x => x + 1);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo completar la operación.");
      // Si se perdió la respuesta, conservar la operación evita pagar dos veces al reintentar.
      const sinRespuesta = !(fallo instanceof ApiError) || fallo.status === 0 || fallo.status >= 500;
      setIncierta(sinRespuesta); alIncierta(sinRespuesta);
    } finally { pendiente.current = false; setOcupado(false); alOcupado(false); }
  }
  function registrar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!datos || bloqueado || datos.compraEstado !== "Recibida") return;
    const monto = Number(importe);
    if (!importe.trim() || !Number.isFinite(monto) || monto <= 0 || monto > datos.saldo || !fecha || !esMedioPago(medio)) { setError("Revisá el importe, la fecha y el medio de pago. El importe no puede superar el saldo."); return; }
    const contenido = JSON.stringify({ monto, fecha, medio, referencia: referencia.trim(), observaciones: observaciones.trim() });
    // Conservar UUID y contenido permite comprobar una respuesta perdida sin registrar otro pago.
    if (intentoRegistro.current?.contenido !== contenido) intentoRegistro.current = { contenido, datos: { operacionId: crypto.randomUUID(), versionCompra: datos.versionCompra, importe: monto, fechaPago: fecha, medioPago: medio, referencia: referencia.trim(), observaciones: observaciones.trim() } };
    else intentoRegistro.current.datos.versionCompra = datos.versionCompra;
    ejecutar({ tipo: "registrar", datos: intentoRegistro.current.datos });
  }
  function anular() {
    if (!seleccionado || bloqueado || !motivo.trim()) return;
    if (!window.confirm("Anular este registro reabrirá el saldo de la compra. No ejecuta una devolución bancaria. ¿Querés continuar?")) return;
    ejecutar({ tipo: "anular", pagoId: seleccionado.id, version: seleccionado.version, motivo: motivo.trim() });
  }
  const paginas = Math.max(1, Math.ceil((datos?.totalRegistros ?? 0) / pagosTamanoPagina));
  return <section className="panel mt" aria-label="Pagos de la compra" aria-busy={cargando}>
    <h3>Pagos y saldo</h3>
    {cargando ? <p role="status">Cargando pagos…</p> : datos && <>
      <p>Pagado: <b>{comprasMoneda(datos.pagado)}</b> · Saldo pendiente: <b>{comprasMoneda(datos.saldo)}</b> · {datos.estadoPago}</p>
      <div className="table-wrap mt"><table><thead><tr><th>Pago</th><th>Fecha</th><th>Medio</th><th>Importe</th><th>Estado / auditoría</th><th>Acciones</th></tr></thead><tbody>{datos.items.map(pago => <tr key={pago.id}>
        <td>{pago.numero}<small className="block">{pago.referencia || "Sin referencia"}</small>{pago.observaciones && <small className="block">{pago.observaciones}</small>}</td><td>{pagosFecha(pago.fechaPago)}</td><td>{pagosMedioNombre(pago.medioPago)}</td><td>{comprasMoneda(pago.importe)}</td>
        <td>{pago.estado}<small className="block">Usuario #{pago.creadoPor ?? "—"} · {comprasFecha(pago.creadoEn)}</small>{pago.anuladoEn && <small className="block">{comprasFecha(pago.anuladoEn)} · Usuario #{pago.modificadoPor ?? "—"} · {pago.motivoAnulacion}</small>}</td>
        <td>{pago.estado === "Vigente" && <Button access="compras.anular_pago" variant="danger-outline small" disabled={bloqueado} onClick={() => { setSeleccionado(pago); setMotivo(""); setError(""); }}>Anular pago</Button>}</td>
      </tr>)}</tbody></table>{!datos.items.length && <p className="empty">No hay pagos registrados.</p>}</div>
      <div className="pagination"><small>Página {pagina} de {paginas} · {datos.totalRegistros} pagos</small><div><Button variant="secondary" disabled={bloqueado || pagina === 1} onClick={() => setPagina(x => x - 1)}>Anterior</Button><Button variant="secondary" disabled={bloqueado || pagina >= paginas} onClick={() => setPagina(x => x + 1)}>Siguiente</Button></div></div>
      {seleccionado && puede("compras.anular_pago") && <div className="mt"><h3>Anular {seleccionado.numero}</h3><Field label="Motivo de anulación del pago" required maxLength={300} value={motivo} disabled={bloqueado} onChange={e => setMotivo(e.target.value)} />
        <div className="modal-actions"><Button variant="secondary" disabled={bloqueado} onClick={() => setSeleccionado(null)}>Volver</Button><Button variant="danger-outline" disabled={bloqueado || !motivo.trim()} onClick={anular}>Confirmar anulación del pago</Button></div></div>}
      {datos.compraEstado === "Recibida" && datos.saldo > 0 && puede("compras.pagar") && <form className="mt" onSubmit={registrar}><h3>Registrar pago parcial o total</h3><fieldset disabled={bloqueado} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="form-grid"><Field label="Importe a pagar (Gs.)" required type="number" min="0.01" max={datos.saldo} step="0.01" value={importe} onChange={e => setImporte(e.target.value)} />
          <Field label="Fecha del pago" required type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          <Field label="Medio de pago" required><select required value={medio} onChange={e => { const valor = e.target.value; if (valor === "" || esMedioPago(valor)) setMedio(valor); }}><option value="">Seleccionar medio</option>{pagosMedios.map(x => <option key={x.codigo} value={x.codigo}>{x.nombre}</option>)}</select></Field>
          <Field label="Referencia" maxLength={100} value={referencia} onChange={e => setReferencia(e.target.value)} />
          <Field label="Observaciones del pago"><textarea rows={2} maxLength={500} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></Field></div>
        <div className="modal-actions"><Button type="submit" disabled={bloqueado}>Registrar pago</Button></div>
      </fieldset></form>}
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {incierta ? <div><p>No se recibió una respuesta definitiva. Reintentá esta misma operación antes de registrar otra.</p><Button disabled={ocupado} onClick={() => { if (accionActual.current) ejecutar(accionActual.current); }}>Reintentar operación</Button></div>
      : <Button variant="secondary" disabled={ocupado || cargando} onClick={() => setRevision(x => x + 1)}>Actualizar pagos</Button>}
  </section>;
}
