import { documentoTipoNombre } from "../contactos/contactosDocumentos";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import * as I from "../../icons";
import { comprasFecha, comprasMoneda, comprasServicio, comprasTamanoPagina } from "./comprasServicio";
import { ComprasEdicion } from "./comprasEdicion";
import { ComprasDetalle } from "./comprasDetalle";
import { useAccess } from "../../services/AccessContext";
import type { CompraEstado, ComprasPagina } from "./comprasTipos";

export function ComprasListado() {
  const puede = useAccess();
  const [consulta, setConsulta] = useState<{ pagina: number; buscar: string; estado: CompraEstado | "" }>({ pagina: 1, buscar: "", estado: "" });
  const [buscar, setBuscar] = useState(""), [revision, setRevision] = useState(0);
  const [datos, setDatos] = useState<ComprasPagina>({ items: [], total: 0, pagina: 1, tamanoPagina: comprasTamanoPagina });
  const [cargando, setCargando] = useState(true), [error, setError] = useState(""), [aviso, setAviso] = useState("");
  const [dialogo, setDialogo] = useState<"nueva" | number | null>(null);
  const paginas = Math.max(1, Math.ceil(datos.total / comprasTamanoPagina));
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError("");
    comprasServicio.listar(consulta.pagina, consulta.buscar, consulta.estado, controlador.signal).then(resultado => {
      if (controlador.signal.aborted) return;
      const ultima = Math.max(1, Math.ceil(resultado.total / comprasTamanoPagina));
      if (consulta.pagina > ultima) setConsulta(anterior => ({ ...anterior, pagina: ultima })); else setDatos(resultado);
    }).catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron consultar las compras."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [consulta, revision]);
  function filtrar(evento: SubmitEvent<HTMLFormElement>) { evento.preventDefault(); setConsulta(anterior => ({ ...anterior, pagina: 1, buscar: buscar.trim() })); }
  function actualizar(mensaje: string) { setAviso(mensaje); setRevision(x => x + 1); }
  return <>
    <div className="page-title"><div><h1>Compras</h1><p>Órdenes y recepción de mercadería en el inventario real.</p></div><div className="page-actions">
      <Button variant="secondary" icon={I.Refresh} disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar</Button>
      <Button access="compras.crear" icon={I.Plus} onClick={() => setDialogo("nueva")}>Nueva orden de compra</Button>
    </div></div>
    {aviso && <p className="info-strip" role="status">{aviso}</p>}
    <form className="filter-bar" onSubmit={filtrar}>
      <div className="search"><I.Search size={19}/><input aria-label="Buscar compras" placeholder="Orden, proveedor, documento o depósito…" maxLength={200} value={buscar} onChange={e => setBuscar(e.target.value)} /></div><Button type="submit" variant="secondary">Buscar</Button>
      <Field label="Estado"><select value={consulta.estado} onChange={e => { const estado = e.target.value; if (estado === "" || estado === "Pendiente" || estado === "Recibida" || estado === "Cancelada") setConsulta(anterior => ({ ...anterior, pagina: 1, estado })); }}><option value="">Todos</option><option>Pendiente</option><option>Recibida</option><option>Cancelada</option></select></Field>
    </form>
    <section className="panel" aria-label="Listado de compras" aria-busy={cargando}>
      {error ? <div className="form-error" role="alert"><p>{error}</p><Button onClick={() => setRevision(x => x + 1)}>Reintentar</Button></div> : cargando ? <p className="empty" role="status">Cargando compras…</p> : <>
        <div className="table-wrap"><table><thead><tr><th>Orden</th><th>Fecha</th><th>Proveedor</th><th>Depósito</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{datos.items.map(x => <tr key={x.id}>
          <td><b>{x.numero}</b></td><td>{comprasFecha(x.creadoEn)}</td><td>{x.proveedorNombre}<small className="block">{documentoTipoNombre(x.proveedorTipoDocumento)} · {x.proveedorDocumento}</small></td><td>{x.depositoNombre}</td><td>{comprasMoneda(x.total)}</td>
          <td><span className={`badge ${x.estado === "Recibida" ? "green" : x.estado === "Pendiente" ? "orange" : "gray"}`}>{x.estado}</span></td>
          <td><Button variant="outline small" onClick={() => setDialogo(x.id)}>Ver detalle</Button></td>
        </tr>)}</tbody></table>{!datos.items.length && <p className="empty">No hay compras para los filtros seleccionados.</p>}</div>
        <div className="pagination"><small>Página {consulta.pagina} de {paginas} · {datos.total} compras</small><div><Button variant="secondary" disabled={consulta.pagina === 1} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina - 1 }))}>Anterior</Button><Button variant="secondary" disabled={consulta.pagina >= paginas} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina + 1 }))}>Siguiente</Button></div></div>
      </>}
    </section>
    <p className="info-strip">El stock cambia al recibir la compra completa. Las órdenes pendientes se pueden cancelar; las recibidas conservan sus movimientos.</p>
    {dialogo === "nueva" && puede("compras.crear") && <ComprasEdicion alCerrar={() => setDialogo(null)} alGuardar={id => { actualizar("Orden de compra creada."); setDialogo(id); }} />}
    {typeof dialogo === "number" && <ComprasDetalle id={dialogo} alCerrar={() => setDialogo(null)} alCambiar={actualizar} />}
  </>;
}
