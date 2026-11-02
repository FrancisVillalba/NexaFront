import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import * as I from "../../icons";
import { productosListar, productosTamanoPagina } from "./productosServicio";
import { ProductosEdicion } from "./productosEdicion";
import { ProductosEstado } from "./productosEstado";
import type { ProductoDto, ProductosConsulta, ProductosPagina } from "./productosTipos";

type Dialogo = { tipo: "edicion"; producto: ProductoDto | null } | { tipo: "estado"; producto: ProductoDto };
const importes = new Intl.NumberFormat("es-PY", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const cantidades = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 3 });

export function ProductosListado() {
  const puede = useAccess();
  const [consulta, setConsulta] = useState<ProductosConsulta>({ pagina: 1, buscar: "", activo: "true" });
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<ProductosPagina>({ items: [], total: 0, pagina: 1, tamanoPagina: productosTamanoPagina });
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const paginas = Math.max(1, Math.ceil(resultado.total / productosTamanoPagina));

  useEffect(() => {
    // Cancelar la consulta anterior evita que una respuesta vieja reemplace los filtros actuales.
    const controlador = new AbortController();
    setCargando(true);
    setError("");
    productosListar(consulta, controlador.signal)
      .then(datos => {
        if (controlador.signal.aborted) return;
        const ultimaPagina = Math.max(1, Math.ceil(datos.total / productosTamanoPagina));
        if (consulta.pagina > ultimaPagina) setConsulta(anterior => ({ ...anterior, pagina: ultimaPagina }));
        else setResultado(datos);
      })
      .catch(fallo => {
        if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron consultar los productos.");
      })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [consulta, revision]);

  function buscar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso("");
    setConsulta(anterior => ({ ...anterior, pagina: 1, buscar: busqueda.trim() }));
  }

  function actualizar(mensaje: string) {
    setDialogo(null);
    setAviso(mensaje);
    setRevision(anterior => anterior + 1);
  }

  return (
    <>
      <div className="page-title">
        <div><h1>Productos</h1><p>Administrá el catálogo de productos.</p></div>
        <div className="page-actions">
          <Button variant="secondary" icon={I.Refresh} disabled={cargando} onClick={() => setRevision(anterior => anterior + 1)}>Actualizar</Button>
          <Button access="productos.crear" icon={I.Plus} onClick={() => { setAviso(""); setDialogo({ tipo: "edicion", producto: null }); }}>Nuevo producto</Button>
        </div>
      </div>
      {aviso && <p className="info-strip" role="status"><I.CircleCheck size={19} />{aviso}</p>}
      <form className="filter-bar" onSubmit={buscar}>
        <div className="search"><I.Search size={19} /><input aria-label="Buscar productos" placeholder="Código, nombre, categoría, marca o código de barras…" maxLength={200} value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
        <Button type="submit" variant="secondary">Buscar</Button>
        <Field label="Estado">
          <select value={consulta.activo} onChange={e => {
            const activo = e.target.value;
            if (activo === "todos" || activo === "true" || activo === "false") setConsulta(anterior => ({ ...anterior, pagina: 1, activo }));
          }}>
            <option value="todos">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
          </select>
        </Field>
      </form>
      {error ? (
        <div className="form-error" role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setRevision(anterior => anterior + 1)}>Reintentar</Button></div>
      ) : cargando ? <p className="empty" role="status">Cargando productos…</p> : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Categoría / marca</th><th>Unidad</th><th>Costo (Gs.)</th><th>Precio (Gs.)</th><th>Stock mínimo</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>{resultado.items.map(producto => (
                <tr key={producto.id}>
                  <td><b>{producto.nombre}</b><small className="block">{producto.codigo}</small>{producto.codigoBarras && <small className="block">{producto.codigoBarras}</small>}</td>
                  <td>{producto.categoria}<small className="block">{producto.marca || "—"}</small></td>
                  <td>{producto.unidadMedida}</td><td>{importes.format(producto.costo)}</td><td>{importes.format(producto.precioVenta)}</td><td>{cantidades.format(producto.stockMinimo)}</td>
                  <td><span className={`badge ${producto.activo ? "green" : "gray"}`}>{producto.activo ? "Activo" : "Inactivo"}</span></td>
                  <td><div className="row-actions">
                    <Button access="productos.editar" variant="outline small productos-accion" icon={I.Edit} aria-label={`Editar ${producto.nombre}`} onClick={() => { setAviso(""); setDialogo({ tipo: "edicion", producto }); }}>Editar</Button>
                    <Button access="productos.estado" variant={`${producto.activo ? "danger-outline" : "outline"} small productos-accion`} aria-label={`${producto.activo ? "Desactivar" : "Activar"} ${producto.nombre}`} onClick={() => { setAviso(""); setDialogo({ tipo: "estado", producto }); }}>{producto.activo ? "Desactivar" : "Activar"}</Button>
                    {!puede("productos.editar") && !puede("productos.estado") && <small>Solo consulta</small>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            {!resultado.items.length && <p className="empty">No hay productos para los filtros seleccionados.</p>}
          </div>
          <div className="pagination">
            <small>Página {consulta.pagina} de {paginas} · {resultado.total} productos</small>
            <div>
              <Button variant="secondary" disabled={consulta.pagina === 1} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina - 1 }))}>Anterior</Button>
              <Button variant="secondary" disabled={consulta.pagina >= paginas} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina + 1 }))}>Siguiente</Button>
            </div>
          </div>
        </>
      )}
      {dialogo?.tipo === "edicion" && puede(dialogo.producto ? "productos.editar" : "productos.crear") && (
        <ProductosEdicion producto={dialogo.producto} alCerrar={() => setDialogo(null)} alGuardar={() => actualizar(dialogo.producto ? "Producto actualizado." : "Producto creado.")} />
      )}
      {dialogo?.tipo === "estado" && puede("productos.estado") && (
        <ProductosEstado producto={dialogo.producto} alCerrar={() => setDialogo(null)} alGuardar={() => actualizar(dialogo.producto.activo ? "Producto desactivado." : "Producto activado.")} />
      )}
    </>
  );
}
