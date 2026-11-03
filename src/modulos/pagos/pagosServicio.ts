import { api } from "../../services/api";
import type { Pago, PagoEntrada, MedioPago, CompraPagos } from "./pagosTipos";
export const pagosTamanoPagina = 20;
export const pagosMedios = [{ codigo: "EFECTIVO", nombre: "Efectivo" }, { codigo: "TRANSFERENCIA", nombre: "Transferencia" }, { codigo: "TARJETA", nombre: "Tarjeta" }, { codigo: "OTRO", nombre: "Otro" }] as const;
export const esMedioPago = (valor: string): valor is MedioPago => pagosMedios.some(x => x.codigo === valor);
export const pagosMedioNombre = (codigo: string) => pagosMedios.find(x => x.codigo === codigo)?.nombre ?? codigo;
export function pagosFechaHoy() {
  const hoy = new Date();
  return String(hoy.getFullYear()) + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
}
export const pagosFecha = (fecha: string) => new Intl.DateTimeFormat("es-PY").format(new Date(fecha + "T12:00:00"));
export const pagosServicio = {
  listar(compraId: number, pagina: number, signal?: AbortSignal) { return api<CompraPagos>("/api/compras/" + compraId + "/pagos?" + new URLSearchParams({ pagina: String(pagina), tamanoPagina: String(pagosTamanoPagina) }), undefined, { signal }); },
  registrar(compraId: number, datos: PagoEntrada) { return api<Pago>("/api/compras/" + compraId + "/pagos", datos); },
  anular(compraId: number, pagoId: number, version: string, motivo: string) { return api<Pago>("/api/compras/" + compraId + "/pagos/" + pagoId + "/anular", { version, motivo }); },
};
