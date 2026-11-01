import type { UserDto, PersonDto, ProfileDto, UserDirectory } from "../types";
import type { FormValues } from "../uiTypes";
import { api } from "./api";

async function listAll<T>(path: string): Promise<T[]> {
  const result: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const page = await api<T[]>(
      path + "?pagina=" + pagina + "&tamanoPagina=100",
    );
    if (!Array.isArray(page))
      throw new Error("La API devolvió un listado inválido.");
    result.push(...page);
    if (page.length < 100) return result;
  }
}

export async function loadUserDirectory(): Promise<UserDirectory> {
  const [users, people, profiles] = await Promise.all([
    listAll<UserDto>("/api/usuarios/usuarios"),
    listAll<PersonDto>("/api/usuarios/personas"),
    listAll<ProfileDto>("/api/usuarios/perfiles"),
  ]);
  return {
    people,
    profiles,
    users: users.map((user) => {
      const person = people.find((x) => x.id === user.personaId);
      return {
        id: user.id,
        personId: user.personaId,
        username: user.nombreUsuario,
        name: person
          ? [person.nombres, person.apellidos].join(" ")
          : user.nombreUsuario,
        role:
          profiles.find((x) => x.id === user.perfilId)?.nombre || "Sin perfil",
        active: user.activo,
      };
    }),
  };
}

export function createUser(values: FormValues) {
  return api<UserDto>("/api/usuarios/usuarios", {
    nombreUsuario: values.username,
    password: values.password,
    personaId: Number(values.personaId),
    perfilId: Number(values.perfilId),
  });
}
