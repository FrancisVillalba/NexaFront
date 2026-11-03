import { useRef, useState } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import type { ContactoComercial, ContactosServicio } from "./contactosTipos";

interface Props { servicio: ContactosServicio; contacto: ContactoComercial; alCerrar: () => void; alGuardar: () => void; }

export function ContactosEstado({ servicio, contacto, alCerrar, alGuardar }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const accion = contacto.activo ? "Desactivar" : "Activar";
  const cerrar = () => { if (!pendiente.current) alCerrar(); };
  async function confirmar() {
    if (pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");
    try { await servicio.cambiarEstado(contacto); alGuardar(); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo cambiar el estado."); }
    finally { pendiente.current = false; setGuardando(false); }
  }
  return (
    <Modal title={`${accion} ${servicio.tipo === "clientes" ? "cliente" : "proveedor"}`} onClose={cerrar}>
      <p>¿Querés {accion.toLowerCase()} el registro de <strong>{contacto.nombreRazonSocial}</strong>?</p>
      <p className="form-help">La baja es lógica y conserva el historial. No modifica usuarios ni registros del otro módulo.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
        <Button access={`${servicio.tipo}.estado`} disabled={guardando} onClick={confirmar}>{guardando ? "Guardando…" : accion}</Button></div>
    </Modal>
  );
}
