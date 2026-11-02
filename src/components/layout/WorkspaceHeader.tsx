import * as I from "../../icons";
import { IconButton } from "../ui";
import { useEffect, useState } from "react";
import { inventarioDepositos } from "../../modulos/inventario/inventarioServicio";
import type { DepositoDto } from "../../modulos/inventario/inventarioTipos";
import { Button } from "../shared/Button";
import { administrationNavigation, rutasDemostracion } from "./navigation";
import type { AppContext, Setter } from "../../uiTypes";

type Props = Pick<AppContext, "warehouse" | "setWarehouse" | "user"> & {
  setCollapsed: Setter<boolean>;
  collapsed: boolean;
  route: string;
  current: string;
  setTopMenu: Setter<string>;
  topMenu: string;
  logout: () => void;
};

// Cada módulo real contiene sus propios filtros y depósitos obtenidos desde la API.
export function WorkspaceHeader({ setCollapsed, collapsed, route, current, warehouse,
  setWarehouse, setTopMenu, topMenu, user, logout }: Props) {
  const [depositos, setDepositos] = useState<DepositoDto[]>([]);
  const [cargandoDepositos, setCargandoDepositos] = useState(true);
  const [errorDepositos, setErrorDepositos] = useState("");
  const puedeConsultarDepositos = user.accesses.some(codigo =>
    ["inventario.ver", "movimientos.ver", "movimientos.crear"].includes(codigo));

  useEffect(() => {
    if (!puedeConsultarDepositos) return;
    let controlador: AbortController | undefined;
    function actualizarDepositos() {
      controlador?.abort();
      const solicitud = new AbortController();
      controlador = solicitud;
      setCargandoDepositos(true);
      setErrorDepositos("");
      setDepositos([]);
      inventarioDepositos(solicitud.signal).then(resultado => {
        if (solicitud.signal.aborted) return;
        const activos = resultado.filter(deposito => deposito.activo);
        setDepositos(activos);
        // Si el depósito elegido se eliminó o desactivó, seleccionar uno vigente.
        setWarehouse(anterior => activos.some(d => d.nombre === anterior) ? anterior : activos[0]?.nombre ?? "");
      }).catch(fallo => {
        if (!solicitud.signal.aborted) setErrorDepositos(fallo instanceof Error ? fallo.message : "No se pudieron cargar los depósitos.");
      }).finally(() => {
        if (!solicitud.signal.aborted) setCargandoDepositos(false);
      });
    }
    actualizarDepositos();
    // Refleja cambios hechos en la base al volver a la aplicación o cambiar de módulo.
    window.addEventListener("focus", actualizarDepositos);
    return () => { controlador?.abort(); window.removeEventListener("focus", actualizarDepositos); };
  }, [route, puedeConsultarDepositos, setWarehouse]);

  return (
    <header className="topbar">
      <IconButton icon={I.Menu} label="Mostrar u ocultar menú" onClick={() => setCollapsed(!collapsed)} />
      <span className="breadcrumb">
        Mi negocio <I.ChevronRight size={13} />
        {administrationNavigation.some(([id]) => id === route) && <>Administración <I.ChevronRight size={13} /></>}
        <b>{current}</b>
      </span>
      <div className="topbar-actions">
      {rutasDemostracion.includes(route) && puedeConsultarDepositos && <label className="warehouse" title={errorDepositos || undefined}>
        <I.BuildingStore size={18} />
        <select aria-label="Depósito activo" value={cargandoDepositos || errorDepositos ? "" : warehouse}
          disabled={cargandoDepositos || !!errorDepositos || !depositos.length} onChange={e => setWarehouse(e.target.value)}>
          {(cargandoDepositos || errorDepositos || !depositos.length) && <option value="">{cargandoDepositos ? "Cargando depósitos…" : errorDepositos ? "Error al cargar depósitos" : "Sin depósitos activos"}</option>}
          {depositos.map(deposito => <option key={deposito.id} value={deposito.nombre}>{deposito.nombre}</option>)}
        </select>
      </label>}
      <div className="top-pop profile-menu">
        <button className="profile" onClick={() => setTopMenu(topMenu === "profile" ? "" : "profile")}>
          <span className="avatar">{user.name[0]}</span>
          <span><b>{user.name.split(" ")[0]}</b><small>{user.role}</small></span>
          <I.ChevronDown size={14} />
        </button>
        {topMenu === "profile" && <div className="dropdown">
          <b>{user.name}</b><p>{user.username}</p>
          <Button variant="secondary" icon={I.Logout} onClick={logout}>Cerrar sesión</Button>
        </div>}
      </div>
      </div>
    </header>
  );
}
