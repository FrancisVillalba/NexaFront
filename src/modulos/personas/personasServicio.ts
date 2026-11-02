import { api } from "../../services/api";
import type { PersonDto } from "../../types";

// Este contrato equivale a CrearPersonaRequest y ActualizarPersonaRequest en C#.
// El servidor genera Id y CreadoEn; el estado se cambia con una operación separada.
export interface PersonInput {
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string;
  telefono: string;
  direccion: string;
}

export interface PeopleQuery {
  pagina: number;
  buscar: string;
  activo: "todos" | "true" | "false";
}

export const PEOPLE_PAGE_SIZE = 20;
const endpoint = "/api/usuarios/personas";

export function listPeople(query: PeopleQuery, signal?: AbortSignal) {
  // URLSearchParams codifica espacios y símbolos, sin concatenar texto del usuario en la URL.
  const parameters = new URLSearchParams({
    pagina: String(query.pagina),
    tamanoPagina: String(PEOPLE_PAGE_SIZE),
    buscar: query.buscar,
  });
  if (query.activo !== "todos") parameters.set("activo", query.activo);
  return api<PersonDto[]>(`${endpoint}?${parameters}`, undefined, { signal });
}

export function savePerson(person: PersonInput, id?: number) {
  return api<PersonDto>(
    id === undefined ? endpoint : `${endpoint}/${id}`,
    person,
    {
      method: id === undefined ? "POST" : "PUT",
    },
  );
}

export function changePersonStatus(id: number, activo: boolean) {
  // PATCH envía solo el cambio de estado. Un 204 exitoso no tiene cuerpo JSON.
  return api<void>(`${endpoint}/${id}/estado`, { activo }, { method: "PATCH" });
}
