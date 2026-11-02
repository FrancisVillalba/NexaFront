export interface DepositoAdministracion {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  version: string;
  creadoEn: string;
  creadoPor: number | null;
  modificadoEn: string | null;
  modificadoPor: number | null;
}
export interface DepositosPagina { items: DepositoAdministracion[]; total: number; pagina: number; tamanoPagina: number; }
export interface DepositosConsulta { pagina: number; buscar: string; activo: "todos" | "true" | "false"; }
export interface DepositoEntrada { nombre: string; descripcion: string; version?: string; }
