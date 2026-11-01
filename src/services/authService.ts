import type { SessionUserDto, User, LoginResponse } from "../types";
import { api } from "./api";
import { clearSession, getSession, saveSession } from "./authSession";

export function mapSessionUser(usuario: SessionUserDto): User {
  if (
    !Number.isInteger(usuario?.usuarioId) ||
    usuario.usuarioId <= 0 ||
    !usuario.perfil ||
    !usuario.nombreUsuario
  ) {
    throw new Error("El backend devolvió datos de usuario inválidos.");
  }
  return {
    id: usuario.usuarioId,
    username: usuario.nombreUsuario,
    name:
      [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") ||
      usuario.nombreUsuario,
    firstName: usuario.nombre,
    lastName: usuario.apellido,
    document: usuario.documento,
    profileId: usuario.perfilId,
    role: usuario.perfil,
    active: true,
  };
}

export async function login( nombreUsuario: string, password: string, remember = false,) {
  const response = await api<LoginResponse>(
    "/api/usuarios/auth/login",
    { nombreUsuario: nombreUsuario.trim(), password },
    { authenticated: false },
  );
  const user = mapSessionUser(response.usuario);
  saveSession(response, remember);
  return user;
}

export async function restoreSession(signal?: AbortSignal) {
  const session = getSession();
  if (!session) return null;
  const usuario = await api<SessionUserDto>(
    "/api/usuarios/auth/me",
    undefined,
    { signal },
  );
  // Una respuesta antigua no debe restablecer una sesión que se cerró mientras esperaba.
  if (getSession()?.token !== session.token) return null;
  return mapSessionUser(usuario);
}

export function logout() {
  clearSession("logout");
}
