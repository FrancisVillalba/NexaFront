import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import { ApiError } from "../../services/api";
import { ventasFecha, ventasMoneda } from "../ventas/ventasServicio";
import { cobrosFecha, cobrosFechaHoy, cobrosMedioNombre, cobrosMedios, cobrosServicio, cobrosTamanoPagina, esMedioPago } from "./cobrosServicio";
import type { Cobro, CobroEntrada, MedioPago, VentaCobros } from "./cobrosTipos";

type Accion = { tipo: "registrar"; datos: CobroEntrada } | { tipo: "anular"; cobroId: number; version: string; motivo: string };
interface Props { ventaId: number; alCambiar: (mensaje: string) => void; alResumen: (cobrado: number | null) => void; alOcupado: (valor: boolean) => void; alIncierta: (valor: boolean) => void; }

export function CobrosVenta({ ventaId, alCambiar, alResumen, alOcupado, alIncierta }: Props) {
  const puede = useAccess();
  const [datos, setDatos] = useState<VentaCobros | null>(null), [pagina, setPagina] = useState(1), [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true), [error, setError] = useState(""), [ocupado, setOcupado] = useState(false), [incierta, setIncierta] = useState(false);
  const [importe, setImporte] = useState(""), [fecha, setFecha] = useState(cobrosFechaHoy), [medio, setMedio] = useState<MedioPago | "">("");
  const [referencia, setReferencia] = useState(""), [observaciones, setObservaciones] = useState("");
  const [seleccionado, setSeleccionado] = useState<Cobro | null>(null), [motivo, setMotivo] = useState("");
  const pendiente = useRef(false), accionActual = useRef<Accion | null>(null);
  const intentoRegistro = useRef<{ contenido: string; datos: CobroEntrada } | null>(null);
  const bloqueado = ocupado || incierta;
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError(""); setDatos(null); setSeleccionado(null); alResumen(null);
    cobrosServicio.listar(ventaId, pagina, controlador.signal).then(res => { if (!controlador.signal.aborted) { setDatos(res); alResumen(res.cobrado); } })
      .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron consultar los cobros."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [ventaId, pagina, revision, alResumen]);
  useEffect(() => {
    if (!incierta) return;
    const avisar = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = ""; };
    window.addEventListener("beforeunload", avisar); return () => window.removeEventListener("beforeunload", avisar);
  }, [incierta]);

  async function ejecutar(accion: Accion) {
    if (pendiente.current) return;
    pendiente.current = true; accionActual.current = accion; setOcupado(true); alOcupado(true); setError("");
    try {
      if (accion.tipo === "registrar") await cobrosServicio.registrar(ventaId, accion.datos);
      else await cobrosServicio.anular(ventaId, accion.cobroId, accion.version, accion.motivo);
      setIncierta(false); alIncierta(false); setSeleccionado(null); setImporte(""); setMotivo(""); intentoRegistro.current = null;
      alCambiar(accion.tipo === "registrar" ? "Cobro registrado. Saldo actualizado." : "Cobro anulado. Saldo actualizado.");
      setRevision(x => x + 1);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo completar la operación.");
      const sinRespuesta = !(fallo instanceof ApiError) || fallo.status === 0 || fallo.status >= 500;
      setIncierta(sinRespuesta); alIncierta(sinRespuesta);
    } finally { pendiente.current = false; setOcupado(false); alOcupado(false); }
  }
  function registrar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!datos || bloqueado || datos.ventaEstado !== "Confirmada") return;
    const monto = Number(importe);
    if (!importe.trim() || !Number.isFinite(monto) || monto <= 0 || monto > datos.saldo || !fecha || !esMedioPago(medio)) { setError("Revisá el importe, la fecha y el medio de pago. El importe no puede superar el saldo."); return; }
    const contenido = JSON.stringify({ monto, fecha, medio, referencia: referencia.trim(), observaciones: observaciones.trim() });
    // Conservar UUID y contenido permite comprobar una respuesta perdida sin registrar otro cobro.
    if (intentoRegistro.current?.contenido !== contenido) intentoRegistro.current = { contenido, datos: { operacionId: crypto.randomUUID(), versionVenta: datos.versionVenta, importe: monto, fechaCobro: fecha, medioPago: medio, referencia: referencia.trim(), observaciones: observaciones.trim() } };
    else intentoRegistro.current.datos.versionVenta = datos.versionVenta;
    ejecutar({ tipo: "registrar", datos: intentoRegistro.current.datos });
  }
  function anular() {
    if (!seleccionado || bloqueado || !motivo.trim()) return;
    if (!window.confirm("Anular este registro reabrirá el saldo de la venta. No ejecuta una devolución bancaria. ¿Querés continuar?")) return;
    ejecutar({ tipo: "anular", cobroId: seleccionado.id, version: seleccionado.version, motivo: motivo.trim() });
  }
  const paginas = Math.max(1, Math.ceil((datos?.totalRegistros ?? 0) / cobrosTamanoPagina));
  return <section className="panel mt" aria-label="Cobros de la venta" aria-busy={cargando}>
    <h3>Cobros y saldo</h3>
    {cargando ? <p role="status">Cargando cobros…</p> : datos && <>
      <p>Cobrado: <b>{ventasMoneda(datos.cobrado)}</b> · Saldo pendiente: <b>{ventasMoneda(datos.saldo)}</b> · {datos.estadoCobro}</p>
      <div className="table-wrap mt"><table><thead><tr><th>Cobro</th><th>Fecha</th><th>Medio</th><th>Importe</th><th>Estado / auditoría</th><th>Acciones</th></tr></thead><tbody>{datos.items.map(cobro => <tr key={cobro.id}>
        <td>{cobro.numero}<small className="block">{cobro.referencia || "Sin referencia"}</small>{cobro.observaciones && <small className="block">{cobro.observaciones}</small>}</td><td>{cobrosFecha(cobro.fechaCobro)}</td><td>{cobrosMedioNombre(cobro.medioPago)}</td><td>{ventasMoneda(cobro.importe)}</td>
        <td>{cobro.estado}<small className="block">Usuario #{cobro.creadoPor ?? "—"} · {ventasFecha(cobro.creadoEn)}</small>{cobro.anuladoEn && <small className="block">{ventasFecha(cobro.anuladoEn)} · Usuario #{cobro.modificadoPor ?? "—"} · {cobro.motivoAnulacion}</small>}</td>
        <td>{cobro.estado === "Vigente" && <Button access="ventas.anular_cobro" variant="danger-outline small" disabled={bloqueado} onClick={() => { setSeleccionado(cobro); setMotivo(""); setError(""); }}>Anular cobro</Button>}</td>
      </tr>)}</tbody></table>{!datos.items.length && <p className="empty">No hay cobros registrados.</p>}</div>
      <div className="pagination"><small>Página {pagina} de {paginas} · {datos.totalRegistros} cobros</small><div><Button variant="secondary" disabled={bloqueado || pagina === 1} onClick={() => setPagina(x => x - 1)}>Anterior</Button><Button variant="secondary" disabled={bloqueado || pagina >= paginas} onClick={() => setPagina(x => x + 1)}>Siguiente</Button></div></div>
      {seleccionado && puede("ventas.anular_cobro") && <div className="mt"><h3>Anular {seleccionado.numero}</h3><Field label="Motivo de anulación del cobro" required maxLength={300} value={motivo} disabled={bloqueado} onChange={e => setMotivo(e.target.value)} />
        <div className="modal-actions"><Button variant="secondary" disabled={bloqueado} onClick={() => setSeleccionado(null)}>Volver</Button><Button variant="danger-outline" disabled={bloqueado || !motivo.trim()} onClick={anular}>Confirmar anulación del cobro</Button></div></div>}
      {datos.ventaEstado === "Confirmada" && datos.saldo > 0 && puede("ventas.cobrar") && <form className="mt" onSubmit={registrar}><h3>Registrar cobro parcial o total</h3><fieldset disabled={bloqueado} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="form-grid"><Field label="Importe a cobrar (Gs.)" required type="number" min="0.01" max={datos.saldo} step="0.01" value={importe} onChange={e => setImporte(e.target.value)} />
          <Field label="Fecha del cobro" required type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          <Field label="Medio de pago" required><select required value={medio} onChange={e => { const valor = e.target.value; if (valor === "" || esMedioPago(valor)) setMedio(valor); }}><option value="">Seleccionar medio</option>{cobrosMedios.map(x => <option key={x.codigo} value={x.codigo}>{x.nombre}</option>)}</select></Field>
          <Field label="Referencia" maxLength={100} value={referencia} onChange={e => setReferencia(e.target.value)} />
          <Field label="Observaciones del cobro"><textarea rows={2} maxLength={500} value={observaciones} onChange={e => setObservaciones(e.target.value)} /></Field></div>
        <div className="modal-actions"><Button type="submit" disabled={bloqueado}>Registrar cobro</Button></div>
      </fieldset></form>}
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {incierta ? <div><p>No se recibió una respuesta definitiva. Reintentá esta misma operación antes de registrar otra.</p><Button disabled={ocupado} onClick={() => { if (accionActual.current) ejecutar(accionActual.current); }}>Reintentar operación</Button></div>
      : <Button variant="secondary" disabled={ocupado || cargando} onClick={() => setRevision(x => x + 1)}>Actualizar cobros</Button>}
  </section>;
}
