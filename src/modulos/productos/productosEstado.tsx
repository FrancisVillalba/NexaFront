import { useRef, useState } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { productosCambiarEstado } from "./productosServicio";
import type { ProductoDto } from "./productosTipos";

interface Props {
  producto: ProductoDto;
  alCerrar: () => void;
  alGuardar: () => void;
}

export function ProductosEstado({ producto, alCerrar, alGuardar }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const accion = producto.activo ? "Desactivar" : "Activar";
  const cerrar = () => { if (!pendiente.current) alCerrar(); };

  async function confirmar() {
    if (pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");
    try {
      await productosCambiarEstado(producto, !producto.activo);
      alGuardar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo cambiar el estado.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Modal title={`${accion} producto`} onClose={cerrar}>
      <p>¿Querés {accion.toLowerCase()} el producto <strong>{producto.codigo} · {producto.nombre}</strong>?</p>
      <p className="form-help">El cambio de estado conserva sus datos e historial.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <Button variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
        <Button access="productos.estado" disabled={guardando} onClick={confirmar}>{guardando ? "Guardando…" : accion}</Button>
      </div>
    </Modal>
  );
}
