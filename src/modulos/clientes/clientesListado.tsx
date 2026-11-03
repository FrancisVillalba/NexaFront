import { ContactosListado } from "../contactos/contactosListado";
import { clientesServicio } from "./clientesServicio";

export function ClientesListado() {
  return <ContactosListado servicio={clientesServicio} />;
}
