import { api } from "../../services/api";
import type { DepositoAdministracion, DepositoEntrada, DepositosConsulta, DepositosPagina } from "./depositosTipos";

export const depositosTamanoPagina = 20;
export const depositosEventoCambio = "nexa:depositos-cambiados";
const ruta = "/api/depositos";

export function depositosListar(consulta: DepositosConsulta, signal?: AbortSignal) {
  const parametros = new URLSearchParams({ pagina: String(consulta.pagina), tamanoPagina: String(depositosTamanoPagina), buscar: consulta.buscar });
  if (consulta.activo !== "todos") parametros.set("activo", consulta.activo);
  return api<DepositosPagina>(`${ruta}?${parametros}`, undefined, { signal });
}

export async function depositosGuardar(datos: DepositoEntrada, id?: number) {
  const resultado = await api<DepositoAdministracion>(id === undefined ? ruta : `${ruta}/${id}`, datos, { method: id === undefined ? "POST" : "PUT" });
  // Solo avisamos al resto de la interfaz después de la confirmación del backend.
  window.dispatchEvent(new Event(depositosEventoCambio));
  return resultado;
}

export async function depositosCambiarEstado(deposito: DepositoAdministracion) {
  await api<void>(`${ruta}/${deposito.id}/estado`, { activo: !deposito.activo, version: deposito.version }, { method: "PATCH" });
  window.dispatchEvent(new Event(depositosEventoCambio));
}
