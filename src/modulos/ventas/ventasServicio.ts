import { api } from "../../services/api";
import type { Venta, VentaCliente, VentaConfirmarEntrada, VentaCotizacion, VentaCotizarEntrada, VentaDeposito, VentaEstado, VentaProducto, VentasPagina } from "./ventasTipos";

export const ventasTamanoPagina = 20;
// La API calcula importes y registra todos los movimientos. No se modifica el estado del template.
export const ventasServicio = {
  listar(pagina: number, buscar: string, estado: VentaEstado | "", signal?: AbortSignal) {
    const parametros = new URLSearchParams({ pagina: String(pagina), tamanoPagina: String(ventasTamanoPagina), buscar });
    if (estado) parametros.set("estado", estado);
    return api<VentasPagina>("/api/ventas?" + parametros, undefined, { signal });
  },
  obtener(id: number, signal?: AbortSignal) { return api<Venta>("/api/ventas/" + id, undefined, { signal }); },
  cotizar(datos: VentaCotizarEntrada) { return api<VentaCotizacion>("/api/ventas/cotizar", datos); },
  confirmar(datos: VentaConfirmarEntrada) { return api<Venta>("/api/ventas", datos); },
  anular(venta: Venta, motivo: string) { return api<Venta>("/api/ventas/" + venta.id + "/anular", { version: venta.version, motivo }); },
  clientes(buscar: string, signal?: AbortSignal) { return api<VentaCliente[]>("/api/ventas/clientes?" + new URLSearchParams({ buscar }), undefined, { signal }); },
  productos(depositoId: number, buscar: string, signal?: AbortSignal) { return api<VentaProducto[]>("/api/ventas/productos?" + new URLSearchParams({ depositoId: String(depositoId), buscar }), undefined, { signal }); },
  depositos(signal?: AbortSignal) { return api<VentaDeposito[]>("/api/ventas/depositos", undefined, { signal }); },
};
export const ventasMoneda = (importe: number) => "Gs. " + new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(importe);
export const ventasFecha = (fecha: string) => new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short" }).format(new Date(fecha));
