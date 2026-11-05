import { api, ApiError } from "../../services/api";
import type { Venta, VentaCliente, VentaCotizacion, VentaCotizarEntrada, VentaDeposito, VentaProducto } from "../ventas/ventasTipos";
import type { Presupuesto, PresupuestoConversion, PresupuestoConvertirEntrada, PresupuestoFiltro, PresupuestoGuardarEntrada, PresupuestosPagina } from "./presupuestosTipos";

// También una respuesta exitosa ilegible puede corresponder a una operación ya confirmada.
export const presupuestosRespuestaIncierta = (fallo: unknown) => !(fallo instanceof ApiError) || fallo.status < 400 || fallo.status >= 500;
export const presupuestosTamanoPagina = 20;
export const presupuestosEstados = ["Borrador", "Aprobado", "Cancelado", "Convertido", "Vencido"] as const;
export const presupuestosEsFiltro = (valor: string): valor is PresupuestoFiltro => valor === "" || presupuestosEstados.some(x => x === valor);
export const presupuestosFecha = (fecha: string) => new Intl.DateTimeFormat("es-PY").format(new Date(fecha + "T12:00:00"));
export function presupuestosVencimientoInicial() {
  const fecha = new Date(); fecha.setDate(fecha.getDate() + 30);
  return String(fecha.getFullYear()) + "-" + String(fecha.getMonth() + 1).padStart(2, "0") + "-" + String(fecha.getDate()).padStart(2, "0");
}
// Los presupuestos locales del template quedan fuera de estas operaciones e identificadores.
export const presupuestosServicio = {
  listar(pagina: number, buscar: string, estado: PresupuestoFiltro, signal?: AbortSignal) {
    const parametros = new URLSearchParams({ pagina: String(pagina), tamanoPagina: String(presupuestosTamanoPagina), buscar });
    if (estado) parametros.set("estado", estado);
    return api<PresupuestosPagina>("/api/presupuestos?" + parametros, undefined, { signal });
  },
  obtener(id: number, signal?: AbortSignal) { return api<Presupuesto>("/api/presupuestos/" + id, undefined, { signal }); },
  cotizar(datos: VentaCotizarEntrada) { return api<VentaCotizacion>("/api/presupuestos/cotizar", datos); },
  guardar(id: number | null, datos: PresupuestoGuardarEntrada) { return api<Presupuesto>("/api/presupuestos" + (id === null ? "" : "/" + id), datos, { method: id === null ? "POST" : "PUT" }); },
  aprobar(p: Presupuesto) { return api<Presupuesto>("/api/presupuestos/" + p.id + "/aprobar", { version: p.version }); },
  cancelar(p: Presupuesto, motivo: string) { return api<Presupuesto>("/api/presupuestos/" + p.id + "/cancelar", { version: p.version, motivo }); },
  preparar(id: number) { return api<PresupuestoConversion>("/api/presupuestos/" + id + "/preparar-conversion", {}); },
  convertir(id: number, datos: PresupuestoConvertirEntrada) { return api<Venta>("/api/presupuestos/" + id + "/convertir", datos); },
  clientes(buscar: string, signal?: AbortSignal) { return api<VentaCliente[]>("/api/presupuestos/clientes?" + new URLSearchParams({ buscar }), undefined, { signal }); },
  productos(depositoId: number, buscar: string, signal?: AbortSignal) { return api<VentaProducto[]>("/api/presupuestos/productos?" + new URLSearchParams({ depositoId: String(depositoId), buscar }), undefined, { signal }); },
  depositos(signal?: AbortSignal) { return api<VentaDeposito[]>("/api/presupuestos/depositos", undefined, { signal }); },
};
