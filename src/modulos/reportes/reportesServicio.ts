import { api } from "../../services/api";
import type { Reporte, ReporteConsulta, ReporteDeposito, ReporteTipo } from "./reportesTipos";

export const reportesOpciones: { tipo: ReporteTipo; nombre: string; permiso: string }[] = [
  { tipo: "ventas", nombre: "Ventas", permiso: "ventas.ver" }, { tipo: "compras", nombre: "Compras recibidas", permiso: "compras.ver" },
  { tipo: "cobros", nombre: "Cobros", permiso: "ventas.ver" }, { tipo: "pagos", nombre: "Pagos", permiso: "compras.ver" },
  { tipo: "inventario", nombre: "Inventario", permiso: "inventario.ver" },
  { tipo: "por-cobrar", nombre: "Cuentas por cobrar", permiso: "clientes.cuenta_corriente" },
  { tipo: "por-pagar", nombre: "Cuentas por pagar", permiso: "proveedores.cuenta_corriente" },
];
export const reportesUsaPeriodo = (tipo: ReporteTipo) => ["ventas", "compras", "cobros", "pagos"].includes(tipo);
export const reportesMoneda = (n: number) => "Gs. " + new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(n);
export const reportesNumero = (n: number) => new Intl.NumberFormat("es-PY", { maximumFractionDigits: 3 }).format(n);
export function reportesHoy() {
  const partes = new Intl.DateTimeFormat("en", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const parte = (tipo: string) => partes.find(x => x.type === tipo)?.value;
  return parte("year") + "-" + parte("month") + "-" + parte("day");
}
export function reportesRestarDias(fecha: string, dias: number) {
  const dia = new Date(fecha + "T00:00:00Z"); dia.setUTCDate(dia.getUTCDate() - dias); return dia.toISOString().slice(0, 10);
}
export const reportesFechaDia = (fecha: string) => new Intl.DateTimeFormat("es-PY").format(new Date(fecha.slice(0, 10) + "T12:00:00"));
export const reportesFechaHora = (fecha: string) => new Intl.DateTimeFormat("es-PY", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" }).format(new Date(fecha));
export function reportesParametros(q: ReporteConsulta) {
  const periodo = reportesUsaPeriodo(q.tipo);
  const params = new URLSearchParams({ tipo: q.tipo, desde: periodo ? q.desde : reportesHoy(), hasta: periodo ? q.hasta : reportesHoy(), pagina: String(q.pagina), tamanoPagina: "20" });
  if (q.depositoId !== null) params.set("depositoId", String(q.depositoId));
  return params;
}
export const reportesServicio = {
  depositos(signal?: AbortSignal) { return api<ReporteDeposito[]>("/api/reportes/depositos", undefined, { signal }); },
  consultar(q: ReporteConsulta, signal?: AbortSignal) { return api<Reporte>("/api/reportes?" + reportesParametros(q), undefined, { signal }); },
  exportar(q: ReporteConsulta) { return api<Reporte>("/api/reportes/exportar?" + reportesParametros(q)); },
};
