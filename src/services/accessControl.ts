import type { User } from "../types";

// El backend determina los permisos y los firma en el token; el perfil no habilita accesos aquí.
export function hasAccess(user: User | null, code: string): boolean {
  return (
    user?.accesses.includes(code) ?? false
  );
}

export function routeAccess(route: string) {
  return route === "nueva-venta"
    ? "ventas.crear"
    : route === "nuevo-presupuesto"
      ? "presupuestos.crear"
      : `${route}.ver`;
}
