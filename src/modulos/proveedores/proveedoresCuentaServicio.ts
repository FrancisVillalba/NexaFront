import { api } from "../../services/api";
import type { ProveedorCuenta } from "./proveedoresCuentaTipos";
export const proveedoresCuentaTamanoPagina = 20;
export function proveedoresCuentaConsultar(proveedorId: number, paginaCompras: number, paginaPagos: number, signal?: AbortSignal) {
  return api<ProveedorCuenta>("/api/proveedores/" + proveedorId + "/cuenta-corriente?" + new URLSearchParams({ paginaCompras: String(paginaCompras), paginaPagos: String(paginaPagos), tamanoPagina: String(proveedoresCuentaTamanoPagina) }), undefined, { signal });
}
