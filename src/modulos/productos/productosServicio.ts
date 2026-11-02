import { api } from "../../services/api";
import type { ProductoDto, ProductoEntrada, ProductosConsulta, ProductosPagina } from "./productosTipos";

const ruta = "/api/productos";
export const productosTamanoPagina = 20;

export function productosListar(consulta: ProductosConsulta, signal?: AbortSignal) {
  const parametros = new URLSearchParams({
    pagina: String(consulta.pagina),
    tamanoPagina: String(productosTamanoPagina),
    buscar: consulta.buscar,
  });
  if (consulta.activo !== "todos") parametros.set("activo", consulta.activo);
  return api<ProductosPagina>(`${ruta}?${parametros}`, undefined, { signal });
}

export function productosObtener(id: number, signal?: AbortSignal) {
  return api<ProductoDto>(`${ruta}/${id}`, undefined, { signal });
}

export function productosGuardar(datos: ProductoEntrada, id?: number) {
  return api<ProductoDto>(id === undefined ? ruta : `${ruta}/${id}`, datos, {
    method: id === undefined ? "POST" : "PUT",
  });
}

export function productosCambiarEstado(producto: ProductoDto, activo: boolean) {
  // La versión impide desactivar o reactivar un producto que cambió desde la última consulta.
  return api<void>(`${ruta}/${producto.id}/estado`, { activo, version: producto.version }, { method: "PATCH" });
}
