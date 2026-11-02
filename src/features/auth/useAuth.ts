import type { User } from "../../types";
import { useCallback, useEffect, useState } from "react";
import { logout, restoreSession } from "../../services/authService";
import {
  clearSession,
  getSession,
  SESSION_ENDED_EVENT,
  SESSION_KEY,
} from "../../services/authSession";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let controller: AbortController | undefined;
    let mounted = true;
    async function restore() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setLoading(true);
      try {
        const restored = await restoreSession(request.signal);
        if (mounted && !request.signal.aborted) setUser(restored);
      } catch (error) {
        if (mounted && !request.signal.aborted) {
          setUser(null);
          setAuthError(
            error instanceof Error
              ? error.message
              : "No se pudo restaurar la sesión.",
          );
        }
      } finally {
        if (mounted && !request.signal.aborted) setLoading(false);
      }
    }
    function ended(event: Event) {
      controller?.abort();
      setUser(null);
      setLoading(false);
      setAuthError(
        (event as CustomEvent<{ reason: string }>).detail?.reason === "logout"
          ? ""
          : "Tu sesión venció o dejó de ser válida. Volvé a ingresar.",
      );
    }
    function changed(event: StorageEvent) {
      if (event.key === SESSION_KEY || event.key === null) restore();
    }
    window.addEventListener(SESSION_ENDED_EVENT, ended);
    window.addEventListener("storage", changed);
    restore();
    return () => {
      mounted = false;
      controller?.abort();
      window.removeEventListener(SESSION_ENDED_EVENT, ended);
      window.removeEventListener("storage", changed);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const session = getSession();
    if (!session) {
      clearSession("expired");
      return;
    }
    const timer = window.setTimeout(
      () => clearSession("expired"),
      Math.max(0, Date.parse(session.expiraEn) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [user]);

  const completeLogin = useCallback((next: User) => {
    setAuthError("");
    setUser(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    let busy = false;
    // Refrescar los permisos no muestra el spinner de inicio ni recarga la página.
    async function refresh() {
      if (busy || controller.signal.aborted) return;
      busy = true;
      try {
        const current = await restoreSession(controller.signal);
        if (!controller.signal.aborted) setUser(current);
      } catch {
        /* Un 401 ya cierra la sesión; una caída de red no borra permisos locales. */
      } finally {
        busy = false;
      }
    }
    window.addEventListener("focus", refresh);
    window.addEventListener("nexa:permissions-changed", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("nexa:permissions-changed", refresh);
    };
  }, [user]);

  return { user, loading, authError, completeLogin, logout };
}
