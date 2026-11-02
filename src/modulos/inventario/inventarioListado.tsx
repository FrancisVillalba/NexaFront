import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import * as I from "../../icons";
import { inventarioDepositos, inventarioListar, inventarioTamanoPagina } from "./inventarioServicio";
import { InventarioMovimiento } from "./inventarioMovimiento";
import type { DepositoDto, ExistenciaDto, InventarioConsulta, InventarioPagina } from "./inventarioTipos";

const numero = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 3 });

export function InventarioListado() {
  const puede = useAccess();
  const [depositos, setDepositos] = useState<DepositoDto[]>([]);
  const [consulta, setConsulta] = useState<InventarioConsulta>({ depositoId: 0, pagina: 1, buscar: "", estado: "todos", activo: "todos" });
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<InventarioPagina>({ items: [], total: 0, pagina: 1, tamanoPagina: inventarioTamanoPagina });
  const [cargandoDepositos, setCargandoDepositos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorDepositos, setErrorDepositos] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [revision, setRevision] = useState(0);
  const [revisionDepositos, setRevisionDepositos] = useState(0);
  const [producto, setProducto] = useState<ExistenciaDto | null>(null);
  const paginas = Math.max(1, Math.ceil(resultado.total / inventarioTamanoPagina));
  const depositoActivo = depositos.some(d => d.id === consulta.depositoId && d.activo);

  useEffect(() => {
    const controller = new AbortController();
    setCargandoDepositos(true);
    setErrorDepositos("");
    inventarioDepositos(controller.signal).then(datos => {
      if (controller.signal.aborted) return;
      setDepositos(datos);
      setConsulta(anterior => ({ ...anterior, depositoId: datos.find(d => d.id === anterior.depositoId)?.id ?? datos.find(d => d.activo)?.id ?? datos[0]?.id ?? 0 }));
    }).catch(fallo => { if (!controller.signal.aborted) setErrorDepositos(fallo instanceof Error ? fallo.message : "No se pudieron cargar los depósitos."); })
      .finally(() => { if (!controller.signal.aborted) setCargandoDepositos(false); });
    return () => controller.abort();
  }, [revisionDepositos]);

  useEffect(() => {
    if (!consulta.depositoId) return;
    const controller = new AbortController();
    setCargando(true);
    setError("");
    inventarioListar(consulta, controller.signal).then(datos => {
      if (controller.signal.aborted) return;
      const ultima = Math.max(1, Math.ceil(datos.total / inventarioTamanoPagina));
      if (consulta.pagina > ultima) setConsulta(anterior => ({ ...anterior, pagina: ultima }));
      else setResultado(datos);
    }).catch(fallo => { if (!controller.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo cargar el inventario."); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [consulta, revision]);

  function buscar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    setConsulta(anterior => ({ ...anterior, buscar: busqueda.trim(), pagina: 1 }));
  }

  return (
    <>
      <div className="page-title"><div><h1>Inventario</h1><p>Existencias por producto y depósito.</p></div>
        <Button variant="secondary" icon={I.Refresh} disabled={cargando || cargandoDepositos} onClick={() => { setRevision(x => x + 1); setRevisionDepositos(x => x + 1); }}>Actualizar</Button>
      </div>
      {aviso && <p className="info-strip" role="status">{aviso}</p>}
      {errorDepositos ? <p className="form-error" role="alert">{errorDepositos} <Button variant="secondary" onClick={() => setRevisionDepositos(x => x + 1)}>Reintentar</Button></p>
        : cargandoDepositos ? <p className="empty" role="status">Cargando depósitos…</p>
        : !depositos.length ? <p className="empty">No hay depósitos registrados.</p> : (
        <>
          <form className="filter-bar" onSubmit={buscar}>
            <Field label="Depósito"><select value={consulta.depositoId} onChange={e => { setProducto(null); setConsulta(anterior => ({ ...anterior, depositoId: Number(e.target.value), pagina: 1 })); }}>
              {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}{d.activo ? "" : " (inactivo)"}</option>)}
            </select></Field>
            <div className="search"><I.Search size={19} /><input aria-label="Buscar existencias" placeholder="Código, producto, categoría o código de barras…" maxLength={200} value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
            <Button type="submit" variant="secondary">Buscar</Button>
            <Field label="Existencias"><select value={consulta.estado} onChange={e => {
              const estado = e.target.value;
              if (estado === "todos" || estado === "bajo" || estado === "sin_stock" || estado === "disponible") setConsulta(anterior => ({ ...anterior, pagina: 1, estado }));
            }}><option value="todos">Todas</option><option value="bajo">En mínimo o por debajo</option><option value="sin_stock">Sin stock</option><option value="disponible">Por encima del mínimo</option></select></Field>
            <Field label="Productos"><select value={consulta.activo} onChange={e => {
              const activo = e.target.value;
              if (activo === "todos" || activo === "true" || activo === "false") setConsulta(anterior => ({ ...anterior, pagina: 1, activo }));
            }}><option value="todos">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></Field>
          </form>
          {error ? <div className="form-error" role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setRevision(x => x + 1)}>Reintentar</Button></div>
            : cargando ? <p className="empty" role="status">Consultando existencias…</p> : (
            <>
              <div className="table-wrap"><table>
                <thead><tr><th>Producto</th><th>Categoría</th><th>Unidad</th><th>Existencia</th><th>Mínimo</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{resultado.items.map(item => <tr key={item.productoId}>
                  <td><b>{item.nombre}</b><small className="block">{item.codigo}{item.activo ? "" : " · Inactivo"}</small></td>
                  <td>{item.categoria}</td><td>{item.unidadMedida}</td><td><b>{numero.format(item.cantidad)}</b></td><td>{numero.format(item.stockMinimo)}</td>
                  <td><span className={`badge ${item.cantidad === 0 ? "red" : item.cantidad <= item.stockMinimo ? "orange" : "green"}`}>{item.cantidad === 0 ? "Sin stock" : item.cantidad <= item.stockMinimo ? "Stock bajo" : "Disponible"}</span></td>
                  <td>{puede("movimientos.crear") ? <Button access="movimientos.crear" variant="outline small" icon={I.ArrowsExchange} disabled={!item.activo || !depositoActivo} onClick={() => setProducto(item)}>Registrar movimiento</Button> : <small>Solo consulta</small>}</td>
                </tr>)}</tbody>
              </table>{!resultado.items.length && <p className="empty">No hay productos para los filtros seleccionados.</p>}</div>
              <div className="pagination"><small>Página {consulta.pagina} de {paginas} · {resultado.total} productos</small><div>
                <Button variant="secondary" disabled={consulta.pagina === 1} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina - 1 }))}>Anterior</Button>
                <Button variant="secondary" disabled={consulta.pagina >= paginas} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina + 1 }))}>Siguiente</Button>
              </div></div>
            </>
          )}
        </>
      )}
      {producto && puede("movimientos.crear") && <InventarioMovimiento producto={producto} depositoId={consulta.depositoId} depositos={depositos}
        alCerrar={() => setProducto(null)} alGuardar={() => { setProducto(null); setAviso("Movimiento registrado. Las existencias se actualizaron."); setRevision(x => x + 1); }} />}
    </>
  );
}
