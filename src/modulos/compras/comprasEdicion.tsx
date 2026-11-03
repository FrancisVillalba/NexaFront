import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { comprasMoneda, comprasServicio } from "./comprasServicio";
import { useComprasBusqueda } from "./comprasBusqueda";
import type { CompraDeposito, CompraProducto, CompraProveedor } from "./comprasTipos";

interface LineaBorrador { producto: CompraProducto; cantidad: number; costoUnitario: number; }
export function ComprasEdicion({ alCerrar, alGuardar }: { alCerrar: () => void; alGuardar: (id: number) => void }) {
  const [buscarProveedor, setBuscarProveedor] = useState("");
  const [proveedor, setProveedor] = useState<CompraProveedor | null>(null);
  const proveedores = useComprasBusqueda(buscarProveedor, comprasServicio.proveedores);
  const [buscarProducto, setBuscarProducto] = useState("");
  const [producto, setProducto] = useState<CompraProducto | null>(null);
  const productos = useComprasBusqueda(buscarProducto, comprasServicio.productos);
  const [depositos, setDepositos] = useState<CompraDeposito[]>([]);
  const [depositoId, setDepositoId] = useState("");
  const [cargandoDepositos, setCargandoDepositos] = useState(true);
  const [errorDepositos, setErrorDepositos] = useState("");
  const [revision, setRevision] = useState(0);
  const [cantidad, setCantidad] = useState("1"), [costo, setCosto] = useState("0");
  const [items, setItems] = useState<LineaBorrador[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState(""), [guardando, setGuardando] = useState(false);
  const ocupado = useRef(false);
  // Un reintento del mismo contenido conserva el identificador, incluso tras una respuesta perdida.
  const intento = useRef<{ contenido: string; operacionId: string } | null>(null);
  useEffect(() => {
    const controlador = new AbortController();
    setCargandoDepositos(true); setErrorDepositos("");
    comprasServicio.depositos(controlador.signal).then(datos => { if (!controlador.signal.aborted) setDepositos(datos); })
      .catch(fallo => { if (!controlador.signal.aborted) setErrorDepositos(fallo instanceof Error ? fallo.message : "No se pudieron cargar los depósitos."); })
      .finally(() => { if (!controlador.signal.aborted) setCargandoDepositos(false); });
    return () => controlador.abort();
  }, [revision]);
  function cerrar() {
    if (ocupado.current) return;
    if ((!items.length && !proveedor && !depositoId && !observaciones) || window.confirm("Tenés una compra sin guardar. ¿Querés descartarla?")) alCerrar();
  }
  function agregar() {
    const qty = Number(cantidad), price = Number(costo);
    if (!producto || !cantidad.trim() || !costo.trim() || !Number.isFinite(qty) || qty <= 0 || qty > 99999999999.999 || Math.abs(qty * 1000 - Math.round(qty * 1000)) > 0.001
      || !Number.isFinite(price) || price < 0 || price > 999999999999.99 || Math.abs(price * 100 - Math.round(price * 100)) > 0.001) { setError("Seleccioná un producto y revisá la cantidad y el costo."); return; }
    if (!["metro", "kilo"].includes(producto.unidadMedida) && !Number.isInteger(qty)) { setError("Esta unidad requiere cantidades enteras."); return; }
    if (items.length >= 200 || items.some(item => item.producto.id === producto.id)) { setError("No se permiten productos repetidos ni más de 200 líneas. Quitá la línea para modificarla."); return; }
    setItems(anterior => [...anterior, { producto, cantidad: qty, costoUnitario: price }]);
    setProducto(null); setBuscarProducto(""); setCantidad("1"); setCosto("0"); setError("");
  }
  async function guardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado.current) return;
    if (!proveedor || !depositos.some(x => x.id === Number(depositoId)) || !items.length) { setError("Seleccioná proveedor, depósito y al menos un producto."); return; }
    const datos = { proveedorId: proveedor.id, depositoId: Number(depositoId), observaciones: observaciones.trim(),
      items: items.map(x => ({ productoId: x.producto.id, cantidad: x.cantidad, costoUnitario: x.costoUnitario })) };
    const contenido = JSON.stringify(datos);
    if (intento.current?.contenido !== contenido) intento.current = { contenido, operacionId: crypto.randomUUID() };
    ocupado.current = true; setGuardando(true); setError("");
    try { const compra = await comprasServicio.crear({ ...datos, operacionId: intento.current.operacionId }); alGuardar(compra.id); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo crear la compra."); }
    finally { ocupado.current = false; setGuardando(false); }
  }
  return <Modal title="Nueva orden de compra" onClose={cerrar} wide><form onSubmit={guardar}>
    <div className="form-grid">
      <Field label="Buscar proveedor" value={buscarProveedor} disabled={guardando} placeholder="Nombre o documento, mínimo 2 caracteres…" maxLength={100} onChange={e => { setBuscarProveedor(e.target.value); setProveedor(null); }} />
      <Field label="Proveedor" required><select required value={proveedor?.id ?? ""} disabled={guardando || proveedores.cargando} onChange={e => setProveedor(proveedores.items.find(x => x.id === Number(e.target.value)) ?? null)}>
        <option value="">{proveedores.cargando ? "Buscando…" : "Seleccionar proveedor"}</option>{proveedores.items.map(x => <option key={x.id} value={x.id}>{x.nombre} · {documentoTipoNombre(x.tipoDocumento)} · {x.documento || "Sin documento"}</option>)}
      </select></Field>
      <Field label="Depósito de recepción" required><select required value={depositoId} disabled={guardando || cargandoDepositos || !!errorDepositos} onChange={e => setDepositoId(e.target.value)}>
        <option value="">Seleccionar depósito</option>{depositos.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
      </select></Field>
      <Field label="Observaciones"><textarea rows={2} maxLength={500} value={observaciones} disabled={guardando} onChange={e => setObservaciones(e.target.value)} /></Field>
    </div>
    <p className="muted">Buscá proveedores activos. Se muestran hasta 20 coincidencias; refiná el nombre o documento si hace falta.</p>
    {!proveedores.cargando && buscarProveedor.trim().length >= 2 && !proveedores.error && !proveedores.items.length && <p>No hay proveedores activos para esa búsqueda.</p>}
    {proveedores.error && <p className="form-error" role="alert">{proveedores.error} <Button type="button" onClick={proveedores.reintentar}>Reintentar proveedores</Button></p>}
    {errorDepositos && <p className="form-error" role="alert">{errorDepositos} <Button type="button" onClick={() => setRevision(x => x + 1)}>Reintentar depósitos</Button></p>}
    {!cargandoDepositos && !errorDepositos && !depositos.length && <p>No hay depósitos activos. Registrá uno desde Administración → Depósitos.</p>}
    <div className="form-grid mt">
      <Field label="Buscar producto" value={buscarProducto} disabled={guardando} placeholder="Nombre, código o código de barras…" maxLength={100} onChange={e => { setBuscarProducto(e.target.value); setProducto(null); }} />
      <Field label="Producto" required><select value={producto?.id ?? ""} disabled={guardando || productos.cargando} onChange={e => { const elegido = productos.items.find(x => x.id === Number(e.target.value)) ?? null; setProducto(elegido); setCosto(String(elegido?.costo ?? 0)); }}>
        <option value="">{productos.cargando ? "Buscando…" : "Seleccionar producto"}</option>{productos.items.map(x => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre} ({x.unidadMedida})</option>)}
      </select></Field>
      <Field label="Cantidad a agregar" required type="number" min="0.001" max="99999999999.999" step={producto && !["metro", "kilo"].includes(producto.unidadMedida) ? "1" : "0.001"} value={cantidad} disabled={guardando} onChange={e => setCantidad(e.target.value)} />
      <Field label="Costo unitario (Gs.)" required type="number" min="0" max="999999999999.99" step="0.01" value={costo} disabled={guardando} onChange={e => setCosto(e.target.value)} />
    </div>
    {!productos.cargando && buscarProducto.trim().length >= 2 && !productos.error && !productos.items.length && <p>No hay productos activos para esa búsqueda.</p>}
    {productos.error && <p className="form-error" role="alert">{productos.error} <Button type="button" onClick={productos.reintentar}>Reintentar productos</Button></p>}
    <Button type="button" variant="secondary" disabled={guardando || !producto} onClick={agregar}>Agregar producto</Button>
    <div className="table-wrap mt"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Costo</th><th>Importe estimado</th><th>Acciones</th></tr></thead><tbody>{items.map(x => <tr key={x.producto.id}>
      <td>{x.producto.codigo} · {x.producto.nombre}</td><td>{x.cantidad} {x.producto.unidadMedida}</td><td>{comprasMoneda(x.costoUnitario)}</td><td>{comprasMoneda(x.cantidad * x.costoUnitario)}</td>
      <td><Button type="button" variant="danger-outline small" disabled={guardando} aria-label={`Quitar ${x.producto.nombre}`} onClick={() => setItems(anterior => anterior.filter(item => item.producto.id !== x.producto.id))}>Quitar</Button></td>
    </tr>)}</tbody></table>{!items.length && <p className="empty">Agregá al menos un producto.</p>}</div>
    <p className="muted">El total definitivo se calcula en el backend. Crear la orden no cambia el stock; la recepción completa lo actualiza.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><Button type="button" variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button><Button type="submit" access="compras.crear" disabled={guardando || !proveedor || !depositoId || !items.length || !!errorDepositos || cargandoDepositos}>{guardando ? "Guardando…" : "Crear orden"}</Button></div>
  </form></Modal>;
}
