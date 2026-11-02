import { api } from "../../services/api";
import type { ProfileDto } from "../../types";

export interface AccessDefinition {
  codigo: string;
  modulo: string;
  accion: string;
  nombre: string;
  exclusivoAdministrador: boolean;
}
export interface ProfileAccess {
  perfilId: number;
  nombrePerfil: string;
  administrador: boolean;
  codigos: string[];
  version: string;
}
export function loadAccessCatalog(signal?: AbortSignal) {
  return api<AccessDefinition[]>("/api/usuarios/accesos", undefined, {
    signal,
  });
}
export async function loadProfiles(signal?: AbortSignal) {
  const profiles: ProfileDto[] = [];
  for (let pagina = 1; ; pagina++) {
    const page = await api<ProfileDto[]>(
      `/api/usuarios/perfiles?pagina=${pagina}&tamanoPagina=100`,
      undefined,
      { signal },
    );
    profiles.push(...page);
    if (page.length < 100) return profiles;
  }
}
export function loadProfileAccess(id: number, signal?: AbortSignal) {
  return api<ProfileAccess>(`/api/usuarios/accesos/perfiles/${id}`, undefined, {
    signal,
  });
}
export function saveProfileAccess(
  id: number,
  codigos: string[],
  version: string,
) {
  return api<ProfileAccess>(
    `/api/usuarios/accesos/perfiles/${id}`,
    { codigos, version },
    { method: "PUT" },
  );
}
export const moduleNames: Record<string, string> = {
  inicio: "Inicio",
  productos: "Productos",
  inventario: "Inventario",
  movimientos: "Movimientos de stock",
  compras: "Compras",
  ventas: "Ventas",
  presupuestos: "Presupuestos",
  clientes: "Clientes",
  proveedores: "Proveedores",
  reportes: "Reportes",
  configuracion: "Configuración",
  personas: "Personas",
  usuarios: "Usuarios",
  perfiles: "Perfiles",
  permisos: "Permisos",
};
