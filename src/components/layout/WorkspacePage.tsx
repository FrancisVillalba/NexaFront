import { People } from "../../modulos/personas/Personas";
import { Profiles } from "../../modulos/perfiles/Perfiles";
import { Users } from "../../modulos/usuarios/Usuarios";
import { Permissions } from "../../modulos/permisos/Permisos";
import { routeAccess } from "../../services/accessControl";
import { Panel } from "../shared/Panel";
import { Dashboard } from "../../modulos/inicio/Inicio";
import { InventarioListado } from "../../modulos/inventario/inventarioListado";
import { ProductosListado } from "../../modulos/productos/productosListado";
import { DepositosListado } from "../../modulos/depositos/depositosListado";
import { MovimientosListado } from "../../modulos/movimientos/movimientosListado";
import { VentasListado } from "../../modulos/ventas/ventasListado";
import { VentasNueva } from "../../modulos/ventas/ventasEdicion";
import { PresupuestosNuevo } from "../../modulos/presupuestos/presupuestosEdicion";
import { ComprasListado } from "../../modulos/compras/comprasListado";
import { PresupuestosListado } from "../../modulos/presupuestos/presupuestosListado";
import { ClientesListado } from "../../modulos/clientes/clientesListado";
import { ProveedoresListado } from "../../modulos/proveedores/proveedoresListado";
import { Reports } from "../../modulos/reportes/Reportes";
import { Settings } from "../../modulos/configuracion/Configuracion";
import type { AppContext } from "../../uiTypes";

// Selecciona la pantalla según la ruta y comprueba su permiso de acceso.
type Props = Pick<
  AppContext,
  "can"
  | "user"
> & {
   route: string;
};

export function WorkspacePage({
  can,
  route,
  user,
}: Props) {
  return (
    <main className="content">
      {!can(routeAccess(route)) ? (
        <Panel title="Sin accesos habilitados">
          <p>
            Tu perfil no tiene acceso a este módulo. Consultá al
            administrador.
          </p>
        </Panel>
      ) : route === "inicio" ? (
        <Dashboard />
      ) : route === "productos" ? (
        <ProductosListado />
      ) : route === "inventario" ? (
        <InventarioListado />
      ) : route === "movimientos" ? (
        <MovimientosListado />
      ) : route === "ventas" ? (
        <VentasListado />
      ) : route === "nueva-venta" ? (
        <VentasNueva />
      ) : route === "nuevo-presupuesto" ? (
        <PresupuestosNuevo />
      ) : route === "compras" ? (
        <ComprasListado />
      ) : route === "presupuestos" ? (
        <PresupuestosListado />
      ) : route === "clientes" ? (
        <ClientesListado />
      ) : route === "proveedores" ? (
        <ProveedoresListado />
      ) : route === "reportes" ? (
        <Reports />
      ) : route === "depositos" ? (
        <DepositosListado />
      ) : route === "usuarios" ? (
        <Users currentUserId={user.id} />
      ) : route === "personas" ? (
        <People />
      ) : route === "perfiles" ? (
        <Profiles />
      ) : route === "permisos" ? (
        <Permissions />
      ) : (
        <Settings />
      )}
    </main>
  );
}
