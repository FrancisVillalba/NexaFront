import { api } from "../../services/api";
import type { Compra, CompraDeposito, CompraEntrada, CompraEstado, CompraProducto, CompraProveedor, ComprasPagina } from "./comprasTipos";

export const comprasTamanoPagina = 20;
// Todos los datos y cambios de Compras pasan por NexaBack; no se escribe en el estado de demostración.
export const comprasServicio = {
  listar(pagina: number, buscar: string, estado: CompraEstado | "", signal?: AbortSignal) {
    const parametros = new URLSearchParams({ pagina: String(pagina), tamanoPagina: String(comprasTamanoPagina), buscar });
    if (estado) parametros.set("estado", estado);
    return api<ComprasPagina>(`/api/compras?${parametros}`, undefined, { signal });
  },
  obtener(id: number, signal?: AbortSignal) { return api<Compra>(`/api/compras/${id}`, undefined, { signal }); },
  crear(datos: CompraEntrada) { return api<Compra>("/api/compras", datos); },
  recibir(compra: Compra) { return api<Compra>(`/api/compras/${compra.id}/recibir`, { version: compra.version }); },
  cancelar(compra: Compra) { return api<Compra>(`/api/compras/${compra.id}/cancelar`, { version: compra.version }); },
  proveedores(buscar: string, signal?: AbortSignal) { return api<CompraProveedor[]>(`/api/compras/proveedores?${new URLSearchParams({ buscar })}`, undefined, { signal }); },
  productos(buscar: string, signal?: AbortSignal) { return api<CompraProducto[]>(`/api/compras/productos?${new URLSearchParams({ buscar })}`, undefined, { signal }); },
  depositos(signal?: AbortSignal) { return api<CompraDeposito[]>("/api/compras/depositos", undefined, { signal }); },
};
export const comprasMoneda = (importe: number) => "Gs. " + new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(importe);
export const comprasFecha = (fecha: string) => new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short" }).format(new Date(fecha));
