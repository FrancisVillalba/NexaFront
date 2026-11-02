import type { UserDto, PersonDto, ProfileDto, UserDirectory } from "../types";
import { api } from "./api";

async function listAll<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const result: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const page = await api<T[]>(
      path + "?pagina=" + pagina + "&tamanoPagina=100",
      undefined,
      { signal },
    );
    if (!Array.isArray(page))
      throw new Error("La API devolvió un listado inválido.");
    result.push(...page);
    if (page.length < 100) return result;
  }
}

export async function loadUserDirectory(
  signal?: AbortSignal,
): Promise<UserDirectory> {
  const [users, people, profiles] = await Promise.all([
    listAll<UserDto>("/api/usuarios/usuarios", signal),
    listAll<PersonDto>("/api/usuarios/personas", signal),
    listAll<ProfileDto>("/api/usuarios/perfiles", signal),
  ]);
  return {
    people,
    profiles,
    users: users.map((user) => {
      const person = people.find((x) => x.id === user.personaId);
      const profile = profiles.find((x) => x.id === user.perfilId);
      return {
        id: user.id,
        personId: user.personaId,
        profileId: user.perfilId,
        username: user.nombreUsuario,
        name: person
          ? [person.nombres, person.apellidos].join(" ")
          : user.nombreUsuario,
        role: profile?.nombre || "Sin perfil",
        active: user.activo,
        personActive: person?.activo ?? false,
        profileActive: profile?.activo ?? false,
        document: person?.documento ?? null,
      };
    }),
  };
}

export interface UserInput {
  nombreUsuario: string;
  personaId: number;
  perfilId: number;
  password: string;
}

export function saveUser(values: UserInput, id?: number) {
  // La edición no envía contraseña ni cambia la persona vinculada a la cuenta.
  const body =
    id === undefined
      ? values
      : { nombreUsuario: values.nombreUsuario, perfilId: values.perfilId };
  return api<UserDto>(
    id === undefined
      ? "/api/usuarios/usuarios"
      : `/api/usuarios/usuarios/${id}`,
    body,
    { method: id === undefined ? "POST" : "PUT" },
  );
}

export function changeUserStatus(id: number, activo: boolean) {
  return api<void>(
    `/api/usuarios/usuarios/${id}/estado`,
    { activo },
    { method: "PATCH" },
  );
}

export function changeUserPassword(id: number, password: string) {
  return api<void>(
    `/api/usuarios/usuarios/${id}/password`,
    { password },
    { method: "PATCH" },
  );
}
