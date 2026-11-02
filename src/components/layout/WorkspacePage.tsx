import { People } from "../../modulos/personas/Personas";
import { Profiles } from "../../modulos/perfiles/Perfiles";
import { Users } from "../../modulos/usuarios/Usuarios";
import { Permissions } from "../../modulos/permisos/Permisos";
import { routeAccess } from "../../services/accessControl";
import { Panel } from "../shared/Panel";
import { Dashboard } from "../../modulos/inicio/Inicio";
import { Inventory } from "../../modulos/inventario/Inventario";
import { ProductosListado } from "../../modulos/productos/productosListado";
import { Movements } from "../../modulos/movimientos/Movimientos";
import { Sales } from "../../modulos/ventas/Ventas";
import { SaleEditor } from "../../modulos/ventas/ventasEdicion";
import { Purchases } from "../../modulos/compras/Compras";
import { Quotes } from "../../modulos/presupuestos/Presupuestos";
import { Contacts } from "../../modulos/contactos/Contactos";
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
        <Inventory title="Inventario" />
      ) : route === "movimientos" ? (
        <Movements />
      ) : route === "ventas" ? (
        <Sales />
      ) : route === "nueva-venta" || route === "nuevo-presupuesto" ? (
        <SaleEditor quoteOnly={route === "nuevo-presupuesto"} />
      ) : route === "compras" ? (
        <Purchases />
      ) : route === "presupuestos" ? (
        <Quotes />
      ) : route === "clientes" || route === "proveedores" ? (
        <Contacts key={route} type={route} />
      ) : route === "reportes" ? (
        <Reports />
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
