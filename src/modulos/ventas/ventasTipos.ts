export type VentaEstado = "Confirmada" | "Anulada";
export interface VentaResumen { id: number; numero: string; clienteNombre: string; clienteTipoDocumento: string | null; clienteDocumento: string; depositoNombre: string; estado: VentaEstado; total: number; version: string; creadoEn: string; }
export interface VentaLinea { id: number; productoId: number; productoCodigo: string; productoNombre: string; unidadMedida: string; cantidad: number; precioUnitario: number; subtotal: number; movimientoSalidaId: number; movimientoAnulacionId: number | null; }
export interface Venta extends VentaResumen { clienteId: number; depositoId: number; observaciones: string | null; subtotal: number; descuento: number; anuladaEn: string | null; motivoAnulacion: string | null; creadoPor: number | null; modificadoEn: string | null; modificadoPor: number | null; items: VentaLinea[]; }
export interface VentasPagina { items: VentaResumen[]; total: number; pagina: number; tamanoPagina: number; }
export interface VentaCliente { id: number; nombre: string; tipoDocumento: string | null; documento: string; }
export interface VentaDeposito { id: number; nombre: string; }
export interface VentaProducto { id: number; codigo: string; nombre: string; unidadMedida: string; precioVenta: number; disponible: number; }
export interface VentaCotizarEntrada { clienteId: number; depositoId: number; descuento: number; items: { productoId: number; cantidad: number }[]; }
export interface VentaCotizacionLinea { productoId: number; codigo: string; nombre: string; unidadMedida: string; cantidad: number; precioUnitario: number; subtotal: number; disponible: number; versionProducto: string; }
export interface VentaCotizacion { clienteId: number; clienteNombre: string; depositoId: number; depositoNombre: string; subtotal: number; descuento: number; total: number; items: VentaCotizacionLinea[]; }
export interface VentaConfirmarEntrada { operacionId: string; clienteId: number; depositoId: number; descuento: number; observaciones: string; items: { productoId: number; cantidad: number; versionProducto: string }[]; }
