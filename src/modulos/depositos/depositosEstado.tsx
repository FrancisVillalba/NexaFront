import { useRef, useState } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { depositosCambiarEstado } from "./depositosServicio";
import type { DepositoAdministracion } from "./depositosTipos";

interface Props { deposito: DepositoAdministracion; alCerrar: () => void; alGuardar: () => void; }

export function DepositosEstado({ deposito, alCerrar, alGuardar }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const accion = deposito.activo ? "Desactivar" : "Activar";
  const cerrar = () => { if (!pendiente.current) alCerrar(); };
  async function confirmar() {
    if (pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");
    try { await depositosCambiarEstado(deposito); alGuardar(); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo cambiar el estado."); }
    finally { pendiente.current = false; setGuardando(false); }
  }
  return (
    <Modal title={`${accion} depósito`} onClose={cerrar}>
      <p>¿Querés {accion.toLowerCase()} el depósito <strong>{deposito.nombre}</strong>?</p>
      <p className="form-help">Se conserva el historial. Para desactivar, todas sus existencias deben estar en cero.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <Button variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
        <Button access="depositos.estado" disabled={guardando} onClick={confirmar}>{guardando ? "Guardando…" : accion}</Button>
      </div>
    </Modal>
  );
}
