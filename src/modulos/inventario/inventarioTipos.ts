export interface DepositoDto { id: number; nombre: string; activo: boolean; }
export interface ExistenciaDto {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  activo: boolean;
  stockMinimo: number;
  cantidad: number;
  version: string | null;
}
export interface InventarioPagina { items: ExistenciaDto[]; total: number; pagina: number; tamanoPagina: number; }
export interface InventarioConsulta {
  depositoId: number;
  pagina: number;
  buscar: string;
  estado: "todos" | "bajo" | "sin_stock" | "disponible";
  activo: "todos" | "true" | "false";
}
export interface MovimientoDto {
  id: number;
  operacionId: string;
  productoId: number;
  codigo: string;
  nombre: string;
  unidadMedida: string;
  depositoId: number;
  deposito: string;
  depositoDestinoId: number | null;
  depositoDestino: string | null;
  tipo: string;
  cantidad: number;
  variacion: number;
  stockAnterior: number;
  stockPosterior: number;
  stockDestinoAnterior: number | null;
  stockDestinoPosterior: number | null;
  motivo: string;
  creadoEn: string;
  creadoPor: number | null;
}
export interface MovimientosPagina { items: MovimientoDto[]; total: number; pagina: number; tamanoPagina: number; }
export interface MovimientoEntrada {
  operacionId: string;
  productoId: number;
  depositoId: number;
  depositoDestinoId: number | null;
  tipo: "entrada" | "salida" | "ajuste" | "transferencia";
  cantidad: number;
  motivo: string;
  versionOrigen: string | null;
}
export const inventarioTiposMovimiento = [
  { valor: "entrada", nombre: "Entrada" }, { valor: "salida", nombre: "Salida" },
  { valor: "ajuste", nombre: "Ajuste de saldo" }, { valor: "transferencia", nombre: "Transferencia" },
] as const;
