import { api } from "../../services/api";
import type { DepositoDto, InventarioConsulta, InventarioPagina } from "./inventarioTipos";

// Consulta las existencias y depósitos reales de NexaBack.
export const inventarioTamanoPagina = 20;
export function inventarioDepositos(signal?: AbortSignal) {
  return api<DepositoDto[]>("/api/inventario/depositos", undefined, { signal });
}
export function inventarioListar(consulta: InventarioConsulta, signal?: AbortSignal) {
  const parametros = new URLSearchParams({ depositoId: String(consulta.depositoId), pagina: String(consulta.pagina),
    tamanoPagina: String(inventarioTamanoPagina), buscar: consulta.buscar, estado: consulta.estado });
  if (consulta.activo !== "todos") parametros.set("activo", consulta.activo);
  return api<InventarioPagina>(`/api/inventario?${parametros}`, undefined, { signal });
}
