import { reportesColumnas } from "./reportesColumnas";
import { reportesMoneda, reportesNumero } from "./reportesServicio";
import type { ReporteFila, ReporteTipo } from "./reportesTipos";

export function ReportesTabla({ tipo, filas }: { tipo: ReporteTipo; filas: ReporteFila[] }) {
  const columnas = reportesColumnas(tipo);
  return <div className="table-wrap"><table><thead><tr>{columnas.map(x => <th key={x.titulo}>{x.titulo}</th>)}</tr></thead><tbody>
    {filas.map(fila => <tr key={fila.id}>{columnas.map(columna => {
      const valor = columna.valor(fila);
      return <td key={columna.titulo}>{valor === null ? "—" : typeof valor === "number" ? columna.formato === "moneda" ? reportesMoneda(valor) : reportesNumero(valor) : valor}</td>;
    })}</tr>)}
  </tbody></table>{!filas.length && <p className="empty">No hay registros para esta consulta.</p>}</div>;
}
