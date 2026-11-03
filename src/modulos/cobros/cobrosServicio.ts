import { api } from "../../services/api";
import type { Cobro, CobroEntrada, MedioPago, VentaCobros } from "./cobrosTipos";
export const cobrosTamanoPagina = 20;
export const cobrosMedios = [{ codigo: "EFECTIVO", nombre: "Efectivo" }, { codigo: "TRANSFERENCIA", nombre: "Transferencia" }, { codigo: "TARJETA", nombre: "Tarjeta" }, { codigo: "OTRO", nombre: "Otro" }] as const;
export const esMedioPago = (valor: string): valor is MedioPago => cobrosMedios.some(x => x.codigo === valor);
export const cobrosMedioNombre = (codigo: string) => cobrosMedios.find(x => x.codigo === codigo)?.nombre ?? codigo;
export function cobrosFechaHoy() {
  const hoy = new Date();
  return String(hoy.getFullYear()) + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
}
export const cobrosFecha = (fecha: string) => new Intl.DateTimeFormat("es-PY").format(new Date(fecha + "T12:00:00"));
export const cobrosServicio = {
  listar(ventaId: number, pagina: number, signal?: AbortSignal) { return api<VentaCobros>("/api/ventas/" + ventaId + "/cobros?" + new URLSearchParams({ pagina: String(pagina), tamanoPagina: String(cobrosTamanoPagina) }), undefined, { signal }); },
  registrar(ventaId: number, datos: CobroEntrada) { return api<Cobro>("/api/ventas/" + ventaId + "/cobros", datos); },
  anular(ventaId: number, cobroId: number, version: string, motivo: string) { return api<Cobro>("/api/ventas/" + ventaId + "/cobros/" + cobroId + "/anular", { version, motivo }); },
};
