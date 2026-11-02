import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { movimientosRegistrar } from "../movimientos/movimientosServicio";
import { inventarioTiposMovimiento } from "./inventarioTipos";
import type { DepositoDto, ExistenciaDto, MovimientoEntrada } from "./inventarioTipos";

interface Props {
  producto: ExistenciaDto;
  depositoId: number;
  depositos: DepositoDto[];
  alCerrar: () => void;
  alGuardar: () => void;
}

export function InventarioMovimiento({ producto, depositoId, depositos, alCerrar, alGuardar }: Props) {
  const [tipo, setTipo] = useState<MovimientoEntrada["tipo"]>("entrada");
  const [cantidad, setCantidad] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  // Mantener el identificador al reintentar la misma solicitud evita duplicados por fallos de red.
  const operacion = useRef(crypto.randomUUID());
  const fraccionable = producto.unidadMedida === "metro" || producto.unidadMedida === "kilo";
  const origen = depositos.find(d => d.id === depositoId);
  const nuevaOperacion = () => { operacion.current = crypto.randomUUID(); };

  function cerrar() {
    if (pendiente.current) return;
    if ((cantidad || motivo || destino) && !window.confirm("¿Querés descartar el movimiento sin guardar?")) return;
    alCerrar();
  }

  async function guardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    setError("");
    const valor = Number(cantidad);
    if (!cantidad.trim() || !Number.isFinite(valor) || valor < 0 || (tipo !== "ajuste" && valor === 0)
      || (!fraccionable && !Number.isInteger(valor)) || !motivo.trim()) {
      setError("Revisá la cantidad y completá el motivo del movimiento.");
      return;
    }
    pendiente.current = true;
    setGuardando(true);
    try {
      await movimientosRegistrar({ operacionId: operacion.current, productoId: producto.productoId, depositoId,
        depositoDestinoId: tipo === "transferencia" ? Number(destino) : null, tipo, cantidad: valor, motivo, versionOrigen: producto.version });
      alGuardar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo registrar el movimiento.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Modal title="Registrar movimiento de stock" onClose={cerrar}>
      <p><strong>{producto.codigo} · {producto.nombre}</strong></p>
      <p className="form-help">Depósito: {origen?.nombre} · Existencia consultada: {producto.cantidad} {producto.unidadMedida}.</p>
      <form onSubmit={guardar}>
        <fieldset disabled={guardando} className="productos-campos">
          <div className="form-grid">
            <Field label="Tipo de movimiento" required>
              <select required value={tipo} onChange={e => {
                const valor = inventarioTiposMovimiento.find(t => t.valor === e.target.value)?.valor;
                if (valor) { setTipo(valor); nuevaOperacion(); }
              }}>{inventarioTiposMovimiento.map(t => <option key={t.valor} value={t.valor}>{t.nombre}</option>)}</select>
            </Field>
            <Field label={tipo === "ajuste" ? "Existencia final deseada" : "Cantidad"} required type="number"
              min={tipo === "ajuste" ? 0 : fraccionable ? 0.001 : 1} max={99999999999.999} step={fraccionable ? "0.001" : "1"}
              value={cantidad} onChange={e => { setCantidad(e.target.value); nuevaOperacion(); }} />
            {tipo === "transferencia" && <Field label="Depósito de destino" required>
              <select required value={destino} onChange={e => { setDestino(e.target.value); nuevaOperacion(); }}>
                <option value="">Seleccionar depósito</option>
                {depositos.filter(d => d.activo && d.id !== depositoId).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </Field>}
            <Field label="Motivo / referencia" required maxLength={300} value={motivo} onChange={e => { setMotivo(e.target.value); nuevaOperacion(); }} />
          </div>
        </fieldset>
        {tipo === "ajuste" && <p className="form-help">Indicá cuántas unidades deben quedar. El sistema registrará la diferencia, incluso si reduce el saldo a cero.</p>}
        {tipo === "transferencia" && <p className="form-help">Se descontará del origen y se sumará al destino en la misma operación.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <Button type="button" variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
          <Button type="submit" access="movimientos.crear" disabled={guardando}>{guardando ? "Registrando…" : "Registrar movimiento"}</Button>
        </div>
      </form>
    </Modal>
  );
}
