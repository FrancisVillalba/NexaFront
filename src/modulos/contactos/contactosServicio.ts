import { api } from "../../services/api";
import type { ContactoComercial, ContactosPagina, ContactosServicio, TipoContacto } from "./contactosTipos";

export const contactosTamanoPagina = 20;

// Las pantallas comparten comportamiento; cada instancia conserva la ruta y los permisos de su módulo.
export function crearContactosServicio(tipo: TipoContacto): ContactosServicio {
  const ruta = `/api/${tipo}`;
  return {
    tipo,
    listar(consulta, signal) {
      const parametros = new URLSearchParams({ pagina: String(consulta.pagina), tamanoPagina: String(contactosTamanoPagina), buscar: consulta.buscar });
      if (consulta.activo !== "todos") parametros.set("activo", consulta.activo);
      return api<ContactosPagina>(`${ruta}?${parametros}`, undefined, { signal });
    },
    guardar(datos, id) {
      return api<ContactoComercial>(id === undefined ? ruta : `${ruta}/${id}`, datos, { method: id === undefined ? "POST" : "PUT" });
    },
    cambiarEstado(contacto) {
      return api<void>(`${ruta}/${contacto.id}/estado`, { activo: !contacto.activo, version: contacto.version }, { method: "PATCH" });
    },
  };
}
