import { reportesFechaDia, reportesMoneda } from "./reportesServicio";
import type { ReporteCategoria, ReporteDia } from "./reportesTipos";

// Las barras se acompañan de cifras y fechas legibles; no dependen de datos del template.
export function ReportesVentasDias({ dias, desde, hasta }: { dias: ReporteDia[]; desde: string; hasta: string }) {
  const filas: ReporteDia[] = [];
  const fecha = new Date(desde + "T00:00:00Z");
  while (fecha.toISOString().slice(0, 10) <= hasta && filas.length < 366) {
    const clave = fecha.toISOString().slice(0, 10);
    filas.push({ fecha: clave, total: dias.find(x => x.fecha === clave)?.total ?? 0 }); fecha.setUTCDate(fecha.getUTCDate() + 1);
  }
  const maximo = Math.max(1, ...filas.map(x => x.total));
  return <div style={{ maxHeight: 300, overflowY: "auto" }} aria-label="Ventas por día">{filas.map(x => <div key={x.fecha} style={{ display: "grid", gridTemplateColumns: "90px minmax(0, 1fr) 130px", gap: 12, alignItems: "center", marginBottom: 10 }}>
    <span>{reportesFechaDia(x.fecha)}</span><progress value={x.total} max={maximo} aria-label={"Ventas del " + x.fecha} style={{ width: "100%" }} /><b>{reportesMoneda(x.total)}</b>
  </div>)}</div>;
}
export function ReportesCategorias({ categorias }: { categorias: ReporteCategoria[] }) {
  return <div className="table-wrap"><table><thead><tr><th>Categoría</th><th>Productos</th><th>Valorización actual al costo</th></tr></thead><tbody>
    {categorias.map(x => <tr key={x.categoria}><td>{x.categoria}</td><td>{x.productos}</td><td>{reportesMoneda(x.valor)}</td></tr>)}
  </tbody></table>{!categorias.length && <p className="empty">No hay productos en el catálogo.</p>}</div>;
}
