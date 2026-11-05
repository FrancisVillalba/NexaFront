export type ReporteTipo = "ventas" | "compras" | "cobros" | "pagos" | "inventario" | "por-cobrar" | "por-pagar";
export interface ReporteConsulta { tipo: ReporteTipo; desde: string; hasta: string; depositoId: number | null; pagina: number; }
export interface ReporteDeposito { id: number; nombre: string; activo: boolean; }
export interface ReporteFila { id: number; referencia: string; fecha: string | null; nombre: string; estado: string; importe: number; aplicado: number; saldo: number; cantidad: number | null; unidad: string | null; costo: number | null; minimo: number | null; }
export interface Reporte { tipo: ReporteTipo; desde: string; hasta: string; depositoId: number | null; depositoNombre: string; generadoEn: string; usaPeriodo: boolean; resumen: { registros: number; importe: number; aplicado: number; saldo: number }; items: ReporteFila[]; pagina: number; tamanoPagina: number; ventas: ReporteVentasDetalle | null; categorias: ReporteCategoria[]; }
export interface InicioIndicador { codigo: string; nombre: string; valor: number; cantidad: number; nota: string; ruta: string; }
export interface InicioResumen { desde: string; hasta: string; depositoId: number | null; depositoNombre: string; generadoEn: string; indicadores: InicioIndicador[]; ultimasVentas: ReporteFila[]; stockBajo: ReporteFila[]; ventasSemana: ReporteDia[]; categorias: ReporteCategoria[]; }

export interface ReporteDia { fecha: string; total: number; }
export interface ReporteCategoria { categoria: string; productos: number; valor: number; }
export interface ReporteVentasDetalle { costo: number; margenEstimado: number; ticketPromedio: number; dias: ReporteDia[]; productos: { productoId: number; codigo: string; nombre: string; unidad: string; cantidad: number; bruto: number }[]; }
