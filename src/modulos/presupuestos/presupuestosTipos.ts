import type { VentaConfirmarEntrada, VentaCotizacion } from "../ventas/ventasTipos";
export type PresupuestoEstado = "Borrador" | "Aprobado" | "Cancelado" | "Convertido";
export type PresupuestoFiltro = PresupuestoEstado | "Vencido" | "";
export interface PresupuestoResumen { id: number; numero: string; clienteNombre: string; clienteTipoDocumento: string | null; clienteDocumento: string; depositoNombre: string; estado: PresupuestoEstado; vencido: boolean; fechaVencimiento: string; total: number; version: string; creadoEn: string; ventaId: number | null; }
export interface PresupuestoLinea { id: number; productoId: number; productoCodigo: string; productoNombre: string; unidadMedida: string; cantidad: number; precioUnitario: number; subtotal: number; }
export interface Presupuesto extends PresupuestoResumen { clienteId: number; depositoId: number; observaciones: string | null; subtotal: number; descuento: number; aprobadoEn: string | null; aprobadoPor: number | null; canceladoEn: string | null; motivoCancelacion: string | null; creadoPor: number | null; modificadoEn: string | null; modificadoPor: number | null; items: PresupuestoLinea[]; }
export interface PresupuestosPagina { items: PresupuestoResumen[]; total: number; pagina: number; tamanoPagina: number; }
export interface PresupuestoGuardarEntrada extends VentaConfirmarEntrada { version: string | null; fechaVencimiento: string; }
export interface PresupuestoConversion { version: string; cotizacion: VentaCotizacion; }
export interface PresupuestoConvertirEntrada { operacionId: string; version: string; items: { productoId: number; versionProducto: string }[]; }
