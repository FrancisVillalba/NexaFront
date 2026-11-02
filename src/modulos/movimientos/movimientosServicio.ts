import { api } from "../../services/api";
import { inventarioTamanoPagina } from "../inventario/inventarioServicio";
import type { MovimientoDto, MovimientoEntrada, MovimientosPagina } from "../inventario/inventarioTipos";

export function movimientosListar(consulta: { pagina: number; depositoId?: number; buscar: string }, signal?: AbortSignal) {
  const parametros = new URLSearchParams({ pagina: String(consulta.pagina), tamanoPagina: String(inventarioTamanoPagina), buscar: consulta.buscar });
  if (consulta.depositoId) parametros.set("depositoId", String(consulta.depositoId));
  return api<MovimientosPagina>(`/api/inventario/movimientos?${parametros}`, undefined, { signal });
}

export function movimientosRegistrar(datos: MovimientoEntrada) {
  return api<MovimientoDto>("/api/inventario/movimientos", datos);
}
