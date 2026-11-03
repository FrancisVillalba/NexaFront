import type { TipoDocumento } from "./contactosDocumentos";

export type TipoContacto = "clientes" | "proveedores";
export interface ContactoComercial {
  id: number;
  nombreRazonSocial: string;
  tipoDocumento: TipoDocumento | null;
  documento: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  observaciones: string | null;
  plazoPagoDias: number;
  limiteCredito: number;
  activo: boolean;
  version: string;
  creadoEn: string;
  creadoPor: number | null;
  modificadoEn: string | null;
  modificadoPor: number | null;
}
export interface ContactosPagina { items: ContactoComercial[]; total: number; pagina: number; tamanoPagina: number; }
export interface ContactosConsulta { pagina: number; buscar: string; activo: "todos" | "true" | "false"; }
export interface ContactoEntrada { tipoDocumento: TipoDocumento; nombreRazonSocial: string; documento: string; correo: string; telefono: string; direccion: string; observaciones: string; plazoPagoDias: number; limiteCredito: number; version?: string; }
export interface ContactosServicio {
  tipo: TipoContacto;
  listar: (consulta: ContactosConsulta, signal?: AbortSignal) => Promise<ContactosPagina>;
  guardar: (datos: ContactoEntrada, id?: number) => Promise<ContactoComercial>;
  cambiarEstado: (contacto: ContactoComercial) => Promise<void>;
}
