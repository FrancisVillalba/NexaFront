import { api } from "../../services/api";
import type { ProfileDto } from "../../types";

// Equivale al DTO C# de alta/edición: el estado se modifica por separado.
export interface ProfileInput {
  nombre: string;
  descripcion: string;
}
export interface ProfilesQuery {
  pagina: number;
  buscar: string;
  activo: "todos" | "true" | "false";
}

export const PROFILES_PAGE_SIZE = 20;
const endpoint = "/api/usuarios/perfiles";

// Coinciden con los roles que hoy determinan los accesos del frontend y del backend.
export const isProtectedProfile = (name: string) => name === "Administrador";

export function listProfiles(query: ProfilesQuery, signal?: AbortSignal) {
  const parameters = new URLSearchParams({
    pagina: String(query.pagina),
    tamanoPagina: String(PROFILES_PAGE_SIZE),
    buscar: query.buscar,
  });
  if (query.activo !== "todos") parameters.set("activo", query.activo);
  return api<ProfileDto[]>(`${endpoint}?${parameters}`, undefined, { signal });
}

export function saveProfile(profile: ProfileInput, id?: number) {
  // POST crea; PUT actualiza el registro señalado por el Id.
  return api<ProfileDto>(
    id === undefined ? endpoint : `${endpoint}/${id}`,
    profile,
    {
      method: id === undefined ? "POST" : "PUT",
    },
  );
}

export function changeProfileStatus(id: number, activo: boolean) {
  return api<void>(`${endpoint}/${id}/estado`, { activo }, { method: "PATCH" });
}
