// Contratos equivalentes a los DTOs del backend. El formulario no envía auditoría ni estado.
export interface ProductoDto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  codigoBarras: string | null;
  marca: string | null;
  categoria: string;
  unidadMedida: string;
  costo: number;
  precioVenta: number;
  stockMinimo: number;
  activo: boolean;
  version: string;
  creadoEn: string;
  creadoPor: number | null;
  modificadoEn: string | null;
  modificadoPor: number | null;
}

export interface ProductoEntrada {
  codigo: string;
  nombre: string;
  descripcion: string;
  codigoBarras: string;
  marca: string;
  categoria: string;
  unidadMedida: string;
  costo: number;
  precioVenta: number;
  stockMinimo: number;
  version?: string;
}

export interface ProductosConsulta {
  pagina: number;
  buscar: string;
  activo: "todos" | "true" | "false";
}

export interface ProductosPagina {
  items: ProductoDto[];
  total: number;
  pagina: number;
  tamanoPagina: number;
}

export const productosUnidades = [
  { valor: "unidad", nombre: "Unidad" },
  { valor: "caja", nombre: "Caja" },
  { valor: "metro", nombre: "Metro" },
  { valor: "kilo", nombre: "Kilo" },
  { valor: "bolsa", nombre: "Bolsa" },
  { valor: "par", nombre: "Par" },
];
