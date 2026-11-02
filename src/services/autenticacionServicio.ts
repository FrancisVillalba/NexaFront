import type { SessionUserDto, User, LoginResponse } from "../types";
import { api } from "./api";
import { clearSession, getSession, saveSession } from "./authSession";

// Leer el JWT solo sirve para mostrar la interfaz. La firma y los permisos
// siempre se validan en el backend antes de ejecutar una operación.
function tokenAccesses(token: string): string[] {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) throw new Error();
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || typeof payload !== "object" || !("permisosVersion" in payload)
      || payload.permisosVersion !== "1") throw new Error();
    const value = "acceso" in payload ? payload.acceso : [];
    const codes = typeof value === "string" ? [value] : value;
    if (!Array.isArray(codes) || !codes.every(code => typeof code === "string")) throw new Error();
    return [...new Set(codes as string[])];
  } catch {
    throw new Error("La sesión no contiene permisos válidos. Volvé a ingresar.");
  }
}

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
    accesses: Array.isArray(usuario.accesos) ? usuario.accesos : [],
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
  const user = { ...mapSessionUser(response.usuario), accesses: tokenAccesses(response.token) };
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
  return { ...mapSessionUser(usuario), accesses: tokenAccesses(session.token) };
}

export function logout() {
  clearSession("logout");
}
