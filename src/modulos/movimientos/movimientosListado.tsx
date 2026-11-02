import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "../../components/shared/Button";
import { Field } from "../../components/ui";
import { inventarioDepositos, inventarioTamanoPagina } from "../inventario/inventarioServicio";
import { movimientosListar } from "./movimientosServicio";
import type { DepositoDto, MovimientosPagina } from "../inventario/inventarioTipos";

const numero = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 3 });
const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

export function MovimientosListado() {
  const [depositos, setDepositos] = useState<DepositoDto[]>([]);
  const [consulta, setConsulta] = useState({ pagina: 1, depositoId: 0, buscar: "" });
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState<MovimientosPagina>({ items: [], total: 0, pagina: 1, tamanoPagina: inventarioTamanoPagina });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const paginas = Math.max(1, Math.ceil(datos.total / inventarioTamanoPagina));

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError("");
    Promise.all([inventarioDepositos(controller.signal), movimientosListar(consulta, controller.signal)]).then(([lista, resultado]) => {
      if (!controller.signal.aborted) { setDepositos(lista); setDatos(resultado); }
    }).catch(fallo => { if (!controller.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron consultar los movimientos."); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [consulta, revision]);

  function buscar(evento: SubmitEvent<HTMLFormElement>) { evento.preventDefault(); setConsulta(anterior => ({ ...anterior, pagina: 1, buscar: busqueda.trim() })); }

  return (
    <>
      <div className="page-title"><div><h1>Movimientos de stock</h1><p>Historial de entradas, salidas, ajustes y transferencias. Registrá nuevos movimientos desde Inventario.</p></div>
        <Button variant="secondary" disabled={cargando} onClick={() => setRevision(x => x + 1)}>Actualizar</Button></div>
      <form className="filter-bar" onSubmit={buscar}>
        <Field label="Depósito"><select value={consulta.depositoId} onChange={e => setConsulta(anterior => ({ ...anterior, pagina: 1, depositoId: Number(e.target.value) }))}>
          <option value={0}>Todos</option>{depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </select></Field>
        <Field label="Buscar" placeholder="Producto, código o motivo…" maxLength={200} value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>
      {error ? <div className="form-error" role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setRevision(x => x + 1)}>Reintentar</Button></div>
        : cargando ? <p className="empty" role="status">Cargando movimientos…</p> : (
        <>
          <div className="table-wrap"><table>
            <thead><tr><th>Fecha / usuario</th><th>Producto</th><th>Tipo</th><th>Depósitos</th><th>Variación origen</th><th>Saldo origen</th><th>Motivo</th></tr></thead>
            <tbody>{datos.items.map(m => <tr key={m.id}>
              <td>{fecha.format(new Date(m.creadoEn))}<small className="block">Usuario #{m.creadoPor ?? "—"} · Movimiento #{m.id}</small></td>
              <td><b>{m.nombre}</b><small className="block">{m.codigo}</small></td><td>{m.tipo}</td>
              <td>{m.deposito}{m.depositoDestino && <small className="block">→ {m.depositoDestino} · {numero.format(m.stockDestinoAnterior ?? 0)} → {numero.format(m.stockDestinoPosterior ?? 0)}</small>}</td>
              <td className={m.variacion >= 0 ? "success-text" : "danger-text"}>{m.variacion > 0 ? "+" : ""}{numero.format(m.variacion)} {m.unidadMedida}</td>
              <td>{numero.format(m.stockAnterior)} → {numero.format(m.stockPosterior)}</td><td>{m.motivo}</td>
            </tr>)}</tbody>
          </table>{!datos.items.length && <p className="empty">No hay movimientos para estos filtros.</p>}</div>
          <div className="pagination"><small>Página {consulta.pagina} de {paginas} · {datos.total} movimientos</small><div>
            <Button variant="secondary" disabled={consulta.pagina === 1} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina - 1 }))}>Anterior</Button>
            <Button variant="secondary" disabled={consulta.pagina >= paginas} onClick={() => setConsulta(anterior => ({ ...anterior, pagina: anterior.pagina + 1 }))}>Siguiente</Button>
          </div></div>
        </>
      )}
    </>
  );
}
