import { clearSession, getSession } from "./authSession";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(
  url: string,
  body?: unknown,
  {
    authenticated = true,
    signal,
    method,
  }: {
    authenticated?: boolean;
    signal?: AbortSignal;
    method?: "GET" | "POST" | "PUT" | "PATCH";
  } = {},
): Promise<T> {
  // El token solo se envía a la API del mismo origen; el proxy se encarga de NexaBack.
  if (!url.startsWith("/api/")) throw new Error("Dirección de API inválida.");
  const headers: Record<string, string> = { Accept: "application/json" };
  const session = authenticated ? getSession() : null;
  if (authenticated && !session) {
    clearSession("expired");
    throw new ApiError("Tu sesión venció. Volvé a ingresar.", 401);
  }
  if (session) headers.Authorization = "Bearer " + session.token;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(url, {
      // Mantener GET/POST por defecto conserva el login; edición y estado indican PUT/PATCH.
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "omit",
      redirect: "error",
      signal,
    });
  } catch (error) {
    if ((error instanceof Error && error.name) === "AbortError") throw error;
    throw new ApiError(
      "No se pudo conectar con NexaBack. Verificá que el backend esté ejecutándose.",
      0,
    );
  }
  const text = await response.text();
  let result: {
    errors?: Record<string, string[]>;
    detail?: string;
    error?: string;
    title?: string;
  } | null;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = null;
  }
  if (!response.ok) {
    if (response.status === 403 && authenticated)
      window.dispatchEvent(new Event("nexa:permissions-changed"));
    if (
      response.status === 401 &&
      authenticated &&
      getSession()?.token === session?.token
    )
      clearSession("unauthorized");
    const validation = result?.errors
      ? Object.values(result.errors).flat().join(" ")
      : "";
    const message =
      result?.detail ||
      validation ||
      result?.error ||
      (response.status === 401
        ? "Usuario o contraseña incorrectos."
        : response.status === 403
          ? "Tu perfil no tiene permiso para esta operación."
          : response.status === 429
            ? "Demasiados intentos. Esperá un minuto antes de volver a ingresar."
            : response.status >= 500
              ? "No se pudo conectar con NexaBack o completar la operación."
              : result?.title || "No se pudo completar la operación.");
    throw new ApiError(message, response.status);
  }
  if (text && result === null)
    throw new ApiError(
      "La API no devolvió JSON. Revisá la dirección de NexaBack.",
      response.status,
    );
  return result as T;
}
