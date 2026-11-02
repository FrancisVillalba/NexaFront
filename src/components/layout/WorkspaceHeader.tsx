import * as I from "../../icons";
import { IconButton } from "../ui";
import { warehouses } from "../../services/commercialConfig";
import { stock } from "../../modulos/inventario/inventarioServicio";
import { Button } from "../shared/Button";
import { administrationNavigation } from "./navigation";
import type { AppContext, Setter } from "../../uiTypes";

// Barra superior: búsqueda, depósito activo, notificaciones y cierre de sesión.
type Props = Pick<
  AppContext,
  "can"
  | "setInventoryQuery"
  | "go"
  | "warehouse"
  | "setWarehouse"
  | "data"
  | "setInventoryFilter"
  | "user"> & { setCollapsed: Setter<boolean>; collapsed: boolean; route: string; current: string; globalSearch: string; setGlobalSearch: Setter<string>; setTopMenu: Setter<string
>; topMenu: string; logout: () => void };

export function WorkspaceHeader({
  setCollapsed,
  collapsed,
  route,
  current,
  can,
  setInventoryQuery,
  globalSearch,
  go,
  setGlobalSearch,
  warehouse,
  setWarehouse,
  setTopMenu,
  topMenu,
  data,
  setInventoryFilter,
  user,
  logout,
}: Props) {
  return (
    <header className="topbar">
      <IconButton
        icon={I.Menu}
        label="Mostrar u ocultar menú"
        onClick={() => setCollapsed(!collapsed)}
      />
      <span className="breadcrumb">
        Mi negocio <I.ChevronRight size={13} />
        {administrationNavigation.some(([id]) => id === route) && (
          <>
            Administración <I.ChevronRight size={13} />
          </>
        )}
        <b>{current}</b>
      </span>
      <form
        style={{
          display:
            can("inventario.ver") || can("productos.ver")
              ? undefined
              : "none",
        }}
        className="global-search"
        onSubmit={(e) => {
          e.preventDefault();
          setInventoryQuery(globalSearch);
          go(can("inventario.ver") ? "inventario" : "productos");
        }}
      >
        <I.Search size={17} />
        <input
          aria-label="Buscar en el inventario"
          placeholder="Buscar producto o código…"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        <kbd>↵</kbd>
      </form>
      <label className="warehouse">
        <I.BuildingStore size={18} />
        <select
          aria-label="Depósito activo"
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
        >
          {warehouses.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </label>
      <div
        className="top-pop"
        style={{ display: can("inventario.ver") ? undefined : "none" }}
      >
        <button
          className="notification icon-btn"
          aria-label="Notificaciones de stock"
          onClick={() =>
            setTopMenu(topMenu === "alerts" ? "" : "alerts")
          }
        >
          <I.Bell size={22} />
          {data.products.some((p) => stock(p, warehouse) <= p.min) && (
            <span />
          )}
        </button>
        {topMenu === "alerts" && (
          <div className="dropdown">
            <b>Atención al inventario</b>
            <p>
              {
                data.products.filter(
                  (p) => stock(p, warehouse) <= p.min,
                ).length
              }{" "}
              productos necesitan reposición en {warehouse}.
            </p>
            <Button
              variant="text"
              onClick={() => {
                setInventoryFilter("Stock bajo");
                go("inventario");
              }}
            >
              Revisar existencias <I.ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
      <div className="top-pop">
        <button
          className="profile"
          onClick={() =>
            setTopMenu(topMenu === "profile" ? "" : "profile")
          }
        >
          <span className="avatar">{user!.name[0]}</span>
          <span>
            <b>{user!.name.split(" ")[0]}</b>
            <small>{user!.role}</small>
          </span>
          <I.ChevronDown size={14} />
        </button>
        {topMenu === "profile" && (
          <div className="dropdown">
            <b>{user!.name}</b>
            <p>{user.username}</p>
            <Button
              variant="secondary"
              icon={I.Logout}
              onClick={logout}
            >
              Cerrar sesión
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
