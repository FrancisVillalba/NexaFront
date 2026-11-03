import type { Cobro } from "../cobros/cobrosTipos";
export interface CuentaVenta { id: number; numero: string; fecha: string; estado: "Confirmada" | "Anulada"; total: number; cobrado: number; saldo: number; estadoCobro: string; }
export interface ClienteCuenta { clienteId: number; clienteNombre: string; tipoDocumento: string | null; documento: string; activo: boolean; totalVentas: number; totalCobros: number; saldo: number; ventas: CuentaVenta[]; totalRegistrosVentas: number; paginaVentas: number; cobros: Cobro[]; totalRegistrosCobros: number; paginaCobros: number; tamanoPagina: number; }
