import type { Icon } from "../../uiTypes";
import * as I from "../../icons";

// Rutas y etiquetas del menú. La visibilidad depende de los permisos del usuario.
export const navigation: [string, string, Icon][] = [
  ["inicio", "Inicio", I.Home],
  ["productos", "Productos", I.Box],
  ["inventario", "Inventario", I.Package],
  ["movimientos", "Movimientos de stock", I.ArrowsExchange],
  ["compras", "Compras", I.ShoppingCart],
  ["ventas", "Ventas y facturación", I.Receipt],
  ["presupuestos", "Presupuestos", I.FileText],
  ["clientes", "Clientes", I.Users],
  ["proveedores", "Proveedores", I.Truck],
  ["reportes", "Reportes", I.ChartBar],
  ["configuracion", "Configuración", I.Settings],
];

export const administrationNavigation: [string, string, Icon][] = [
  ["depositos", "Depósitos", I.BuildingStore],
  ["personas", "Personas", I.User],
  ["usuarios", "Usuarios", I.Users],
  ["perfiles", "Perfiles", I.ShieldCheck],
  ["permisos", "Permisos", I.Lock],
];

// Estos módulos aún conservan la demostración local y no alteran el inventario real.
export const rutasDemostracion = ["inicio", "ventas", "nueva-venta", "presupuestos", "nuevo-presupuesto", "reportes", "configuracion"];
