import { api } from "../../services/api";
import type { ClienteCuenta } from "./clientesCuentaTipos";
export const clientesCuentaTamanoPagina = 20;
export function clientesCuentaConsultar(clienteId: number, paginaVentas: number, paginaCobros: number, signal?: AbortSignal) {
  return api<ClienteCuenta>("/api/clientes/" + clienteId + "/cuenta-corriente?" + new URLSearchParams({ paginaVentas: String(paginaVentas), paginaCobros: String(paginaCobros), tamanoPagina: String(clientesCuentaTamanoPagina) }), undefined, { signal });
}
