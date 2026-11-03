import { documentoTipoNombre } from "./contactosDocumentos";
import { useEffect, useState } from "react";
import type { Client, Contact } from "../../types/commercial";
import { clientesServicio } from "../clientes/clientesServicio";
import { proveedoresServicio } from "../proveedores/proveedoresServicio";
import type { ContactosServicio } from "./contactosTipos";

// Recorre todas las páginas: los selectores no deben limitarse a los primeros 20 registros.
export async function cargarCatalogoContactos(servicio: ContactosServicio, signal: AbortSignal): Promise<Client[]> {
  const contactos: Client[] = [];
  for (let pagina = 1; ; pagina++) {
    const resultado = await servicio.listar({ pagina, buscar: "", activo: "todos" }, signal);
    contactos.push(...resultado.items.map(contacto => ({
      // El prefijo distingue los IDs reales de los antiguos IDs del template (c1, s1...).
      id: `${servicio.tipo}:${contacto.id}`,
      name: contacto.nombreRazonSocial,
      doc: documentoTipoNombre(contacto.tipoDocumento) + " · " + contacto.documento, phone: contacto.telefono ?? "",
      email: contacto.correo ?? "", address: contacto.direccion ?? "",
      credit: contacto.limiteCredito, active: contacto.activo,
    })));
    if (pagina * resultado.tamanoPagina >= resultado.total) return contactos;
    if (!resultado.items.length) throw new Error("El catálogo cambió durante la consulta. Volvé a actualizar.");
  }
}

// Catálogo en memoria: se consulta al navegar, al volver a la ventana y al cambiar la sesión.
// No se guarda información personal del backend en el almacenamiento de la demostración.
export function useContactosCatalogo(sesion: string, ruta: string, verClientes: boolean, verProveedores: boolean) {
  const [estado, setEstado] = useState<{ clave: string; clients: Client[]; suppliers: Contact[]; cargando: boolean; error: string }>({ clave: "", clients: [], suppliers: [], cargando: false, error: "" });
  const [revision, setRevision] = useState(0);
  const clave = `${sesion}|${ruta}|${verClientes}|${verProveedores}|${revision}`;
  useEffect(() => {
    const actualizar = () => setRevision(valor => valor + 1);
    window.addEventListener("focus", actualizar);
    return () => window.removeEventListener("focus", actualizar);
  }, []);
  useEffect(() => {
    const controlador = new AbortController();
    setEstado({ clave, clients: [], suppliers: [], cargando: !!sesion, error: "" });
    if (!sesion) return () => controlador.abort();
    Promise.allSettled([
      verClientes ? cargarCatalogoContactos(clientesServicio, controlador.signal) : Promise.resolve([]),
      verProveedores ? cargarCatalogoContactos(proveedoresServicio, controlador.signal) : Promise.resolve([]),
    ]).then(([clientes, proveedores]) => {
      if (controlador.signal.aborted) return;
      const errores = [clientes, proveedores].flatMap((resultado, indice) => resultado.status === "rejected"
        ? [`${indice === 0 ? "Clientes" : "Proveedores"}: ${resultado.reason instanceof Error ? resultado.reason.message : "No se pudo cargar el catálogo."}`] : []);
      setEstado({ clave, clients: clientes.status === "fulfilled" ? clientes.value : [], suppliers: proveedores.status === "fulfilled" ? proveedores.value : [], cargando: false, error: errores.join(" ") });
    });
    return () => controlador.abort();
  }, [clave, sesion, verClientes, verProveedores]);
  return { ...(estado.clave === clave ? estado : { clients: [], suppliers: [], cargando: !!sesion, error: "" }), actualizar: () => setRevision(valor => valor + 1) };
}
