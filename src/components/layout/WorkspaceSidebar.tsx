import * as I from "../../icons";
import { Brand } from "../ui";
import { cn } from "../shared/helpers";
import { navigation, administrationNavigation } from "./navigation";
import type { AppContext, Setter } from "../../uiTypes";

// Menú lateral: presenta únicamente las rutas habilitadas para el usuario.
type Props = Pick<
  AppContext,
  "go"
  | "data"
> & {
   allowed: string[];
  route: string;
  collapsed: boolean;
  administrationOpen: boolean;
  setAdministrationOpen: Setter<boolean>;
};

export function WorkspaceSidebar({
  allowed,
  route,
  go,
  collapsed,
  data,
  administrationOpen,
  setAdministrationOpen,
}: Props) {
  return (
    <aside className="sidebar">
      <Brand />
      <div className="nav-caption">ESPACIO DE TRABAJO</div>
      <nav>
        {navigation
          .filter(
            (n) => allowed.includes(n[0]) && n[0] !== "configuracion",
          )
          .map(([id, label, Icon]) => (
            <button
              key={id}
              aria-label={label}
              className={cn(
                (route === id ||
                  (id === "ventas" && route === "nueva-venta") ||
                  (id === "presupuestos" &&
                    route === "nuevo-presupuesto")) &&
                  "selected",
              )}
              onClick={() => go(id)}
              title={collapsed ? label : undefined}
            >
              <Icon size={21} />
              <span>{label}</span>
              {id === "inventario" && (
                <small>{data.products.length}</small>
              )}
            </button>
          ))}
        {administrationNavigation.some(([id]) =>
          allowed.includes(id),
        ) && (
          <div className="administration-nav">
            <button
              type="button"
              aria-label="Administración"
              aria-expanded={administrationOpen}
              aria-controls="administration-submenu"
              title="Administración"
              className={cn(
                administrationNavigation.some(([id]) => id === route) &&
                  "selected",
              )}
              onClick={() => setAdministrationOpen((open) => !open)}
            >
              <I.ShieldCheck size={21} />
              <span>Administración</span>
              <I.ChevronDown
                size={15}
                className={cn(
                  "administration-chevron",
                  administrationOpen && "open",
                )}
              />
            </button>
            <div
              id="administration-submenu"
              className="administration-submenu"
              hidden={!administrationOpen}
            >
              {administrationNavigation
                .filter(([id]) => allowed.includes(id))
                .map(([id, label, Icon]) => (
                  <button
                    type="button"
                    key={id}
                    title={label}
                    aria-label={label}
                    aria-current={route === id ? "page" : undefined}
                    className={cn(route === id && "selected")}
                    onClick={() => go(id)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
        {allowed.includes("configuracion") && (
          <button
            type="button"
            aria-label="Configuración"
            title={collapsed ? "Configuración" : undefined}
            className={cn(route === "configuracion" && "selected")}
            onClick={() => go("configuracion")}
          >
            <I.Settings size={21} />
            <span>Configuración</span>
          </button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <span className="demo-dot" />
        <div>
          <b>Modo demostración</b>
          <small>Tus cambios se guardan aquí</small>
        </div>
      </div>
    </aside>
  );
}
