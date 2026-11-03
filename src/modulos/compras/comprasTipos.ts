export type CompraEstado = "Pendiente" | "Recibida" | "Cancelada";
export interface CompraResumen { id: number; numero: string; proveedorNombre: string; proveedorTipoDocumento: string | null; proveedorDocumento: string | null; depositoNombre: string; estado: CompraEstado; total: number; version: string; creadoEn: string; }
export interface CompraLinea { id: number; productoId: number; productoCodigo: string; productoNombre: string; unidadMedida: string; cantidad: number; costoUnitario: number; subtotal: number; movimientoId: number | null; }
export interface Compra extends CompraResumen { proveedorId: number; depositoId: number; observaciones: string | null; recibidoEn: string | null; creadoPor: number | null; modificadoEn: string | null; modificadoPor: number | null; items: CompraLinea[]; }
export interface ComprasPagina { items: CompraResumen[]; total: number; pagina: number; tamanoPagina: number; }
export interface CompraEntrada { operacionId: string; proveedorId: number; depositoId: number; observaciones: string; items: { productoId: number; cantidad: number; costoUnitario: number }[]; }
export interface CompraProveedor { id: number; nombre: string; tipoDocumento: string | null; documento: string | null; }
export interface CompraProducto { id: number; codigo: string; nombre: string; unidadMedida: string; costo: number; }
export interface CompraDeposito { id: number; nombre: string; }
