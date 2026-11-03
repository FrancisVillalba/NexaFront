import { ContactosListado } from "../contactos/contactosListado";
import { proveedoresServicio } from "./proveedoresServicio";

export function ProveedoresListado() {
  return <ContactosListado servicio={proveedoresServicio} />;
}
