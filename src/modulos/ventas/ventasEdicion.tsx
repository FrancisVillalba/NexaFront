import { useCallback, useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useApp } from "../../services/AppContext";
import { ApiError } from "../../services/api";
import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { useVentasBusqueda } from "./ventasBusqueda";
import { ventasMoneda, ventasServicio } from "./ventasServicio";
import { VentasDetalle } from "./ventasDetalle";
import type { VentaCliente, VentaConfirmarEntrada, VentaCotizacion, VentaDeposito, VentaProducto } from "./ventasTipos";

interface LineaBorrador { producto: VentaProducto; cantidad: number; }
export function VentasEdicion({ alCerrar, alGuardar }: { alCerrar: () => void; alGuardar: (id: number) => void }) {
  const [buscarCliente, setBuscarCliente] = useState(""), [cliente, setCliente] = useState<VentaCliente | null>(null);
  const clientes = useVentasBusqueda(buscarCliente, ventasServicio.clientes);
  const [depositos, setDepositos] = useState<VentaDeposito[]>([]), [depositoId, setDepositoId] = useState("");
  const [errorDepositos, setErrorDepositos] = useState(""), [cargandoDepositos, setCargandoDepositos] = useState(true);
  const [revision, setRevision] = useState(0);
  const [buscarProducto, setBuscarProducto] = useState(""), [producto, setProducto] = useState<VentaProducto | null>(null);
  const consultarProductos = useCallback((buscar: string, signal?: AbortSignal) => ventasServicio.productos(Number(depositoId), buscar, signal), [depositoId]);
  const productos = useVentasBusqueda(buscarProducto, consultarProductos);
  const [cantidad, setCantidad] = useState("1"), [items, setItems] = useState<LineaBorrador[]>([]);
  const [descuento, setDescuento] = useState("0"), [observaciones, setObservaciones] = useState("");
  const [cotizacion, setCotizacion] = useState<VentaCotizacion | null>(null);
  const [error, setError] = useState(""), [ocupado, setOcupado] = useState(false), [incierta, setIncierta] = useState(false);
  const pendiente = useRef(false), solicitud = useRef<VentaConfirmarEntrada | null>(null);
  const bloqueado = ocupado || incierta;

  useEffect(() => {
    const controlador = new AbortController();
    setCargandoDepositos(true); setErrorDepositos("");
    ventasServicio.depositos(controlador.signal).then(datos => { if (!controlador.signal.aborted) setDepositos(datos); })
      .catch(fallo => { if (!controlador.signal.aborted) setErrorDepositos(fallo instanceof Error ? fallo.message : "No se pudieron cargar los depósitos."); })
      .finally(() => { if (!controlador.signal.aborted) setCargandoDepositos(false); });
    return () => controlador.abort();
  }, [revision]);
  useEffect(() => {
    if (!incierta) return;
    const avisar = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = ""; };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [incierta]);

  function invalidar() { setCotizacion(null); solicitud.current = null; setError(""); }
  function cerrar() {
    if (pendiente.current) return;
    const texto = incierta ? "No se recibió la respuesta de confirmación. Reintentá para comprobarla; si salís, revisá el listado antes de crear otra venta. ¿Querés salir?"
      : "Tenés una venta sin confirmar. ¿Querés descartarla?";
    if ((!items.length && !cliente && !observaciones) || window.confirm(texto)) alCerrar();
  }
  function cambiarDeposito(valor: string) {
    if (items.length && !window.confirm("Cambiar el depósito quitará los productos de esta venta. ¿Querés continuar?")) return;
    setDepositoId(valor); setProducto(null); setBuscarProducto(""); setItems([]); invalidar();
  }
  function agregar() {
    const qty = Number(cantidad);
    if (!producto || !cantidad.trim() || !Number.isFinite(qty) || qty <= 0 || qty > 99999999999.999
      || Math.abs(qty * 1000 - Math.round(qty * 1000)) > 0.001) { setError("Seleccioná un producto y una cantidad válida, con hasta tres decimales."); return; }
    if (!["metro", "kilo"].includes(producto.unidadMedida) && !Number.isInteger(qty)) { setError("Esta unidad requiere cantidades enteras."); return; }
    if (qty > producto.disponible) { setError("La cantidad supera las existencias consultadas. Volvé a buscar el producto para actualizarlo."); return; }
    if (items.length >= 200 || items.some(x => x.producto.id === producto.id)) { setError("No se permiten productos repetidos ni más de 200 líneas. Quitá la línea para cambiar su cantidad."); return; }
    setItems(anterior => [...anterior, { producto, cantidad: qty }]); setProducto(null); setBuscarProducto(""); setCantidad("1"); invalidar();
  }
  async function cotizar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current || incierta) return;
    const rebaja = Number(descuento);
    if (!cliente || !depositos.some(x => x.id === Number(depositoId)) || !items.length || !descuento.trim() || !Number.isFinite(rebaja) || rebaja < 0) {
      setError("Seleccioná cliente, depósito y productos, y revisá el descuento."); return;
    }
    pendiente.current = true; setOcupado(true); setError(""); setCotizacion(null); solicitud.current = null;
    try {
      setCotizacion(await ventasServicio.cotizar({ clienteId: cliente.id, depositoId: Number(depositoId), descuento: rebaja,
        items: items.map(x => ({ productoId: x.producto.id, cantidad: x.cantidad })) }));
    } catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo calcular el total."); }
    finally { pendiente.current = false; setOcupado(false); }
  }
  async function confirmar() {
    if (pendiente.current || !cotizacion) return;
    // Al perderse una respuesta, se bloquea la edición y se reenvía exactamente el mismo UUID y contenido.
    solicitud.current ??= { operacionId: crypto.randomUUID(), clienteId: cotizacion.clienteId, depositoId: cotizacion.depositoId,
      descuento: cotizacion.descuento, observaciones: observaciones.trim(),
      items: cotizacion.items.map(x => ({ productoId: x.productoId, cantidad: x.cantidad, versionProducto: x.versionProducto })) };
    pendiente.current = true; setOcupado(true); setError("");
    try { const venta = await ventasServicio.confirmar(solicitud.current); setIncierta(false); alGuardar(venta.id); }
    catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo confirmar la venta.");
      setIncierta(!(fallo instanceof ApiError) || fallo.status === 0 || fallo.status >= 500);
    } finally { pendiente.current = false; setOcupado(false); }
  }
  return <Modal title="Nueva venta" onClose={cerrar} wide><form onSubmit={cotizar}>
    <fieldset disabled={bloqueado} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="form-grid">
        <Field label="Buscar cliente" placeholder="Nombre, razón social o documento, mínimo 2 caracteres…" maxLength={100} value={buscarCliente} onChange={e => { setBuscarCliente(e.target.value); setCliente(null); invalidar(); }} />
        <Field label="Cliente" required><select required value={cliente?.id ?? ""} disabled={clientes.cargando} onChange={e => { setCliente(clientes.items.find(x => x.id === Number(e.target.value)) ?? null); invalidar(); }}>
          <option value="">{clientes.cargando ? "Buscando…" : "Seleccionar cliente"}</option>{clientes.items.map(x => <option key={x.id} value={x.id}>{x.nombre} · {documentoTipoNombre(x.tipoDocumento)} {x.documento}</option>)}
        </select></Field>
        <Field label="Depósito" required><select required value={depositoId} disabled={cargandoDepositos || !!errorDepositos} onChange={e => cambiarDeposito(e.target.value)}>
          <option value="">Seleccionar depósito</option>{depositos.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </select></Field>
        <Field label="Observaciones"><textarea rows={2} maxLength={500} value={observaciones} onChange={e => { setObservaciones(e.target.value); invalidar(); }} /></Field>
      </div>
      {clientes.error && <p className="form-error" role="alert">{clientes.error} <Button type="button" onClick={clientes.reintentar}>Reintentar clientes</Button></p>}
      {!clientes.cargando && buscarCliente.trim().length >= 2 && !clientes.error && !clientes.items.length && <p>No hay clientes activos para esa búsqueda.</p>}
      <p className="muted">Las búsquedas muestran hasta 20 coincidencias. Refiná el nombre o documento si hace falta.</p>
      {errorDepositos && <p className="form-error" role="alert">{errorDepositos} <Button type="button" onClick={() => setRevision(x => x + 1)}>Reintentar depósitos</Button></p>}
      {!cargandoDepositos && !errorDepositos && !depositos.length && <p>No hay depósitos activos. Registrá uno desde Administración → Depósitos.</p>}
      <div className="form-grid mt">
        <Field label="Buscar producto" value={buscarProducto} disabled={!depositoId} maxLength={100} placeholder="Nombre, código o código de barras…" onChange={e => { setBuscarProducto(e.target.value); setProducto(null); }} />
        <Field label="Producto" required><select value={producto?.id ?? ""} disabled={!depositoId || productos.cargando} onChange={e => setProducto(productos.items.find(x => x.id === Number(e.target.value)) ?? null)}>
          <option value="">{productos.cargando ? "Buscando…" : "Seleccionar producto"}</option>{productos.items.map(x => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre} · Disponible: {x.disponible} {x.unidadMedida}</option>)}
        </select></Field>
        <Field label="Cantidad a agregar" type="number" required min="0.001" max="99999999999.999" step={producto && !["metro", "kilo"].includes(producto.unidadMedida) ? "1" : "0.001"} value={cantidad} onChange={e => setCantidad(e.target.value)} />
      </div>
      {productos.error && <p className="form-error" role="alert">{productos.error} <Button type="button" onClick={productos.reintentar}>Reintentar productos</Button></p>}
      {!productos.cargando && buscarProducto.trim().length >= 2 && !productos.error && !productos.items.length && <p>No hay productos activos para esa búsqueda.</p>}
      {producto && <p>{ventasMoneda(producto.precioVenta)} por {producto.unidadMedida} · Disponible: {producto.disponible}</p>}
      <Button type="button" variant="secondary" disabled={!producto} onClick={agregar}>Agregar producto</Button>
      <div className="table-wrap mt"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th>Acciones</th></tr></thead><tbody>{items.map(x => {
        const calculado = cotizacion?.items.find(linea => linea.productoId === x.producto.id);
        return <tr key={x.producto.id}><td>{x.producto.codigo} · {x.producto.nombre}</td><td>{x.cantidad} {x.producto.unidadMedida}</td>
          <td>{ventasMoneda(calculado?.precioUnitario ?? x.producto.precioVenta)}</td><td>{ventasMoneda(calculado?.subtotal ?? x.cantidad * x.producto.precioVenta)}</td>
          <td><Button type="button" variant="danger-outline small" aria-label={"Quitar " + x.producto.nombre} onClick={() => { setItems(anterior => anterior.filter(linea => linea.producto.id !== x.producto.id)); invalidar(); }}>Quitar</Button></td></tr>;
      })}</tbody></table>{!items.length && <p className="empty">Agregá al menos un producto.</p>}</div>
      <Field label="Descuento total (Gs.)" type="number" required min="0" max="999999999999.99" step="0.01" value={descuento} onChange={e => { setDescuento(e.target.value); invalidar(); }} />
      <Button type="submit" variant="secondary" disabled={!cliente || !depositoId || !items.length || cargandoDepositos || !!errorDepositos}>Calcular total</Button>
    </fieldset>
    {cotizacion ? <div className="mt"><p>{cotizacion.clienteNombre} · {cotizacion.depositoNombre}</p><p>Subtotal: {ventasMoneda(cotizacion.subtotal)} · Descuento: {ventasMoneda(cotizacion.descuento)}</p>
      <div className="total"><span>Total calculado por el backend</span><strong>{ventasMoneda(cotizacion.total)}</strong></div></div>
      : <p className="muted mt">Calculá el total antes de confirmar. Los precios mostrados inicialmente son una referencia del catálogo.</p>}
    <p className="form-help">Confirmar registra la venta y la salida de stock. No registra cobros. El cálculo previo no reserva existencias.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {incierta && <p role="status">No se recibió una respuesta definitiva. Reintentá la confirmación para comprobarla sin duplicar la venta.</p>}
    <div className="modal-actions"><Button type="button" variant="secondary" disabled={ocupado} onClick={cerrar}>Cerrar</Button>
      <Button type="button" access="ventas.crear" disabled={ocupado || !cotizacion} onClick={confirmar}>{ocupado ? "Procesando…" : incierta ? "Reintentar confirmación" : "Confirmar venta"}</Button></div>
  </form></Modal>;
}

// La ruta del botón Nueva venta de Inicio usa el mismo formulario conectado a la API.
export function VentasNueva() {
  const { go } = useApp();
  const [ventaId, setVentaId] = useState<number | null>(null);
  return <><div className="page-title"><h1>{ventaId === null ? "Nueva venta" : "Venta registrada"}</h1><Button variant="secondary" onClick={() => go("ventas")}>Volver a ventas</Button></div>
    {ventaId === null ? <VentasEdicion alCerrar={() => go("ventas")} alGuardar={setVentaId} />
      : <VentasDetalle id={ventaId} alCerrar={() => go("ventas")} alCambiar={() => {}} />}</>;
}
