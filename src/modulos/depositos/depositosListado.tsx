import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { useAccess } from "../../services/AccessContext";
import * as I from "../../icons";
import { depositosListar, depositosTamanoPagina } from "./depositosServicio";
import { DepositosEdicion } from "./depositosEdicion";
import { DepositosEstado } from "./depositosEstado";
import type { DepositoAdministracion, DepositosConsulta, DepositosPagina } from "./depositosTipos";

type Dialogo = { tipo: "edicion"; deposito: DepositoAdministracion | null } | { tipo: "estado"; deposito: DepositoAdministracion };

export function DepositosListado() {
  const puede = useAccess();
  const [consulta, setConsulta] = useState<DepositosConsulta>({ pagina: 1, buscar: "", activo: "todos" });
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState<DepositosPagina>({ items: [], total: 0, pagina: 1, tamanoPagina: depositosTamanoPagina });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [revision, setRevision] = useState(0);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const paginas = Math.max(1, Math.ceil(datos.total / depositosTamanoPagina));

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setError("");
    depositosListar(consulta, controlador.signal).then(resultado => {
      if (controlador.signal.aborted) return;
      const ultima = Math.max(1, Math.ceil(resultado.total / depositosTamanoPagina));
      if (consulta.pagina > ultima) setConsulta(anterior => ({ ...anterior, pagina: ultima }));
      else setDatos(resultado);
    }).catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron cargar los depósitos."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [consulta, revision]);

  function buscar(evento: SubmitEvent<HTMLFormElement>) { evento.preventDefault(); setConsulta(anterior => ({ ...anterior, pagina: 1, buscar: busqueda.trim() })); }
  function actualizar(mensaje: string) { setDialogo(null); setAviso(mensaje); setRevision(anterior => anterior + 1); }

  return (
    <>
      <div className="page-title"><div><h1>Depósitos</h1><p>Administrá los depósitos utilizados por Inventario.</p></div><div className="page-actions">
        <Button variant="secondary" icon={I.Refresh} disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar</Button>
        <Button access="depositos.crear" icon={I.Plus} onClick={() => { setAviso(""); setDialogo({ tipo: "edicion", deposito: null }); }}>Nuevo depósito</Button>
      </div></div>
      {aviso && <p className="info-strip" role="status">{aviso}</p>}
      <form className="filter-bar" onSubmit={buscar}>
        <div className="search"><I.Search size={19} /><input aria-label="Buscar depósitos" placeholder="Nombre o descripción…" maxLength={200} value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
        <Button type="submit" variant="secondary">Buscar</Button>
        <Field label="Estado"><select value={consulta.activo} onChange={e => {
          const activo = e.target.value;
          if (activo === "todos" || activo === "true" || activo === "false") setConsulta(anterior => ({ ...anterior, pagina: 1, activo }));
        }}><option value="todos">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></Field>
      </form>
      <section className="panel" aria-label="Listado de depósitos" aria-busy={cargando}>
      {error ? <div className="form-error" role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setRevision(x => x + 1)}>Reintentar</Button></div>
        : cargando ? <p className="empty" role="status">Cargando depósitos…</p> : (
        <>
          <div className="table-wrap"><table>
            <thead><tr><th>Depósito</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>{datos.items.map(deposito => <tr key={deposito.id}>
              <td><b>{deposito.nombre}</b></td><td>{deposito.descripcion || "—"}</td>
              <td><span className={`badge ${deposito.activo ? "green" : "gray"}`}>{deposito.activo ? "Activo" : "Inactivo"}</span></td>
              <td><div className="row-actions">
                <Button access="depositos.editar" variant="outline small productos-accion" icon={I.Edit} aria-label={`Editar ${deposito.nombre}`} onClick={() => { setAviso(""); setDialogo({ tipo: "edicion", deposito }); }}>Editar</Button>
                <Button access="depositos.estado" variant={`${deposito.activo ? "danger-outline" : "outline"} small productos-accion`} aria-label={`${deposito.activo ? "Desactivar" : "Activar"} ${deposito.nombre}`} onClick={() => { setAviso(""); setDialogo({ tipo: "estado", deposito }); }}>{deposito.activo ? "Desactivar" : "Activar"}</Button>
                {!puede("depositos.editar") && !puede("depositos.estado") && <small>Solo consulta</small>}
              </div></td>
            </tr>)}</tbody>
          </table>{!datos.items.length && <p className="empty">No hay depósitos para los filtros seleccionados.</p>}</div>
          <div className="pagination"><small>Página {consulta.pagina} de {paginas} · {datos.total} depósitos</small><div>
            <Button variant="secondary" disabled={consulta.pagina === 1} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina - 1 }))}>Anterior</Button>
            <Button variant="secondary" disabled={consulta.pagina >= paginas} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina + 1 }))}>Siguiente</Button>
          </div></div>
        </>
      )}
      </section>
      {dialogo?.tipo === "edicion" && puede(dialogo.deposito ? "depositos.editar" : "depositos.crear") && <DepositosEdicion deposito={dialogo.deposito} alCerrar={() => setDialogo(null)} alGuardar={() => actualizar(dialogo.deposito ? "Depósito actualizado." : "Depósito creado.")} />}
      {dialogo?.tipo === "estado" && puede("depositos.estado") && <DepositosEstado deposito={dialogo.deposito} alCerrar={() => setDialogo(null)} alGuardar={() => actualizar(dialogo.deposito.activo ? "Depósito desactivado." : "Depósito activado.")} />}
    </>
  );
}
