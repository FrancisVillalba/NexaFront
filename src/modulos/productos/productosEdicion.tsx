import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import { productosGuardar } from "./productosServicio";
import { productosUnidades } from "./productosTipos";
import type { ProductoDto, ProductoEntrada } from "./productosTipos";

interface Props {
  producto: ProductoDto | null;
  alCerrar: () => void;
  alGuardar: () => void;
}

export function ProductosEdicion({ producto, alCerrar, alGuardar }: Props) {
  // Los números se mantienen como texto mientras se escribe para admitir un campo temporalmente vacío.
  const [datos, setDatos] = useState({
    codigo: producto?.codigo ?? "",
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    codigoBarras: producto?.codigoBarras ?? "",
    marca: producto?.marca ?? "",
    categoria: producto?.categoria ?? "",
    unidadMedida: producto?.unidadMedida ?? "unidad",
    costo: String(producto?.costo ?? 0),
    precioVenta: producto ? String(producto.precioVenta) : "",
    stockMinimo: String(producto?.stockMinimo ?? 0),
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const fraccionable = datos.unidadMedida === "metro" || datos.unidadMedida === "kilo";
  const accion = producto ? "productos.editar" : "productos.crear";

  function cambiar(campo: keyof typeof datos, valor: string) {
    setDatos(anterior => ({ ...anterior, [campo]: valor }));
  }

  function cerrar() {
    if (!pendiente.current && (!hayCambios() || window.confirm("Tenés cambios sin guardar. ¿Querés descartarlos?"))) alCerrar();
  }

  function hayCambios() {
    return datos.codigo !== (producto?.codigo ?? "") || datos.nombre !== (producto?.nombre ?? "")
      || datos.descripcion !== (producto?.descripcion ?? "") || datos.codigoBarras !== (producto?.codigoBarras ?? "")
      || datos.marca !== (producto?.marca ?? "") || datos.categoria !== (producto?.categoria ?? "")
      || datos.unidadMedida !== (producto?.unidadMedida ?? "unidad") || datos.costo !== String(producto?.costo ?? 0)
      || datos.precioVenta !== (producto ? String(producto.precioVenta) : "") || datos.stockMinimo !== String(producto?.stockMinimo ?? 0);
  }

  async function guardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    setError("");
    const costo = Number(datos.costo), precioVenta = Number(datos.precioVenta), stockMinimo = Number(datos.stockMinimo);
    if (!datos.codigo.trim() || !datos.nombre.trim() || !datos.categoria.trim()) {
      setError("Completá código, nombre y categoría.");
      return;
    }
    if (!Number.isFinite(costo) || !Number.isFinite(precioVenta) || !Number.isFinite(stockMinimo)
      || costo < 0 || precioVenta <= 0 || stockMinimo < 0 || (!fraccionable && !Number.isInteger(stockMinimo))) {
      setError("Revisá los importes y el stock mínimo. El precio debe ser mayor que cero.");
      return;
    }
    pendiente.current = true;
    setGuardando(true);
    try {
      const entrada: ProductoEntrada = { ...datos, costo, precioVenta, stockMinimo, version: producto?.version };
      await productosGuardar(entrada, producto?.id);
      alGuardar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo guardar el producto.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Modal title={producto ? "Editar producto" : "Nuevo producto"} onClose={cerrar} wide>
      <p className="form-help">Los campos con <span className="required-mark">*</span> son obligatorios. El código y el código de barras deben ser únicos.</p>
      <form onSubmit={guardar}>
        <fieldset disabled={guardando} className="productos-campos">
          <div className="form-grid">
            <Field label="Código / SKU" required maxLength={50} value={datos.codigo} onChange={e => cambiar("codigo", e.target.value)} />
            <Field label="Nombre" required maxLength={150} value={datos.nombre} onChange={e => cambiar("nombre", e.target.value)} />
            <Field label="Código de barras" maxLength={80} value={datos.codigoBarras} onChange={e => cambiar("codigoBarras", e.target.value)} />
            <Field label="Marca" maxLength={100} value={datos.marca} onChange={e => cambiar("marca", e.target.value)} />
            <Field label="Categoría" required maxLength={100} value={datos.categoria} onChange={e => cambiar("categoria", e.target.value)} />
            <Field label="Unidad de medida" required>
              <select required value={datos.unidadMedida} onChange={e => cambiar("unidadMedida", e.target.value)}>
                {productosUnidades.map(unidad => <option key={unidad.valor} value={unidad.valor}>{unidad.nombre}</option>)}
              </select>
            </Field>
            <Field label="Costo (Gs.)" required type="number" min={0} max={999999999999.99} step="0.01" value={datos.costo} onChange={e => cambiar("costo", e.target.value)} />
            <Field label="Precio de venta (Gs.)" required type="number" min={0.01} max={999999999999.99} step="0.01" value={datos.precioVenta} onChange={e => cambiar("precioVenta", e.target.value)} />
            <Field label="Stock mínimo" required type="number" min={0} max={99999999999.999} step={fraccionable ? "0.001" : "1"} value={datos.stockMinimo} onChange={e => cambiar("stockMinimo", e.target.value)} />
            <Field label="Descripción">
              <textarea rows={3} maxLength={1000} value={datos.descripcion} onChange={e => cambiar("descripcion", e.target.value)} />
            </Field>
          </div>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <Button type="button" variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
          <Button type="submit" access={accion} disabled={guardando}>{guardando ? "Guardando…" : "Guardar producto"}</Button>
        </div>
      </form>
    </Modal>
  );
}
