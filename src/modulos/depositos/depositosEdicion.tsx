import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { depositosGuardar } from "./depositosServicio";
import type { DepositoAdministracion } from "./depositosTipos";

interface Props { deposito: DepositoAdministracion | null; alCerrar: () => void; alGuardar: () => void; }

export function DepositosEdicion({ deposito, alCerrar, alGuardar }: Props) {
  const [nombre, setNombre] = useState(deposito?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(deposito?.descripcion ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);

  function cerrar() {
    if (pendiente.current) return;
    const cambiado = nombre !== (deposito?.nombre ?? "") || descripcion !== (deposito?.descripcion ?? "");
    if (!cambiado || window.confirm("Tenés cambios sin guardar. ¿Querés descartarlos?")) alCerrar();
  }

  async function guardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    setError("");
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    pendiente.current = true;
    setGuardando(true);
    try {
      await depositosGuardar({ nombre, descripcion, version: deposito?.version }, deposito?.id);
      alGuardar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar el depósito.");
    } finally { pendiente.current = false; setGuardando(false); }
  }

  return (
    <Modal title={deposito ? "Editar depósito" : "Nuevo depósito"} onClose={cerrar}>
      <p className="form-help">El nombre es obligatorio y debe ser único. La auditoría se registra automáticamente.</p>
      <form onSubmit={guardar}>
        <div className="form-grid">
          <Field label="Nombre" required maxLength={100} value={nombre} disabled={guardando} onChange={e => setNombre(e.target.value)} />
          <Field label="Descripción"><textarea rows={3} maxLength={300} value={descripcion} disabled={guardando} onChange={e => setDescripcion(e.target.value)} /></Field>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <Button type="button" variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
          <Button type="submit" access={deposito ? "depositos.editar" : "depositos.crear"} disabled={guardando}>{guardando ? "Guardando…" : "Guardar depósito"}</Button>
        </div>
      </form>
    </Modal>
  );
}
