import { reportesFechaDia, reportesFechaHora } from "./reportesServicio";
import type { Reporte, ReporteFila, ReporteTipo } from "./reportesTipos";

export interface ReporteColumna { titulo: string; formato?: "moneda" | "numero"; valor: (fila: ReporteFila) => string | number | null; }
export function reportesColumnas(tipo: ReporteTipo): ReporteColumna[] {
  if (tipo === "inventario") return [
    { titulo: "Código", valor: x => x.referencia }, { titulo: "Producto", valor: x => x.nombre }, { titulo: "Estado", valor: x => x.estado },
    { titulo: "Cantidad actual", formato: "numero", valor: x => x.cantidad }, { titulo: "Unidad", valor: x => x.unidad },
    { titulo: "Mínimo", formato: "numero", valor: x => x.minimo }, { titulo: "Costo actual", formato: "moneda", valor: x => x.costo },
    { titulo: "Valorización actual", formato: "moneda", valor: x => x.importe },
  ];
  const cuenta = tipo === "por-cobrar" || tipo === "por-pagar";
  const cobroPago = tipo === "cobros" || tipo === "pagos";
  const columnas: ReporteColumna[] = [
    { titulo: cuenta ? "Documento" : "Referencia", valor: x => x.referencia },
    { titulo: tipo === "ventas" || tipo === "cobros" || tipo === "por-cobrar" ? "Cliente" : "Proveedor", valor: x => x.nombre },
  ];
  if (!cuenta) columnas.push({ titulo: tipo === "compras" ? "Recepción" : "Fecha", valor: x => x.fecha ? cobroPago ? reportesFechaDia(x.fecha) : reportesFechaHora(x.fecha) : null });
  columnas.push({ titulo: cobroPago ? "Medio" : "Estado", valor: x => x.estado }, { titulo: "Importe", formato: "moneda", valor: x => x.importe });
  if (!cobroPago) columnas.push({ titulo: tipo === "ventas" || tipo === "por-cobrar" ? "Cobrado actual" : "Pagado actual", formato: "moneda", valor: x => x.aplicado }, { titulo: "Saldo actual", formato: "moneda", valor: x => x.saldo });
  return columnas;
}
// Excel interpreta ciertos textos como fórmulas: exportarlos como texto conserva su contenido.
function celda(valor: string | number | null) {
  let texto = String(valor ?? "");
  if (typeof valor === "string" && /^[\s]*[=+@-]/.test(texto)) texto = "'" + texto;
  return '"' + texto.replaceAll('"', '""') + '"';
}
export function reportesCsv(datos: Reporte) {
  const columnas = reportesColumnas(datos.tipo);
  const filas: (string | number | null)[][] = [
    ["Reporte", datos.tipo, "Depósito", datos.depositoNombre],
    ["Generado", datos.generadoEn, datos.usaPeriodo ? "Período" : "Situación actual", datos.usaPeriodo ? datos.desde + " al " + datos.hasta : "Todos los períodos"],
    ["Registros", datos.resumen.registros, "Importe", datos.resumen.importe],
    columnas.map(x => x.titulo), ...datos.items.map(fila => columnas.map(columna => columna.valor(fila))),
  ];
  return "\uFEFF" + filas.map(fila => fila.map(celda).join(";")).join("\r\n");
}
export function reportesDescargar(datos: Reporte) {
  const url = URL.createObjectURL(new Blob([reportesCsv(datos)], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a"); enlace.href = url; enlace.download = "reporte-" + datos.tipo + ".csv"; enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
