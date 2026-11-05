import { Field } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import type { useTiposDocumento } from "./tiposDocumentoEstado";

export function TiposDocumentoSelector({ catalogo, valor, alCambiar, deshabilitado }: {
  catalogo: ReturnType<typeof useTiposDocumento>; valor: string; alCambiar: (valor: string) => void; deshabilitado: boolean;
}) {
  return <div>
    <Field label="Tipo de documento" required><select required value={valor} disabled={deshabilitado || catalogo.cargando || !!catalogo.error} onChange={e => alCambiar(e.target.value)}>
      <option value="">{catalogo.cargando ? "Cargando tipos de documento…" : "Seleccionar tipo de documento"}</option>
      {catalogo.items.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.nombre}{!tipo.activo && " (inactivo, conservar actual)"}</option>)}
    </select></Field>
    {catalogo.error && <p className="form-error" role="alert">{catalogo.error} <Button type="button" variant="secondary" disabled={deshabilitado} onClick={catalogo.reintentar}>Reintentar tipos</Button></p>}
    {!catalogo.cargando && !catalogo.error && !catalogo.items.length && <p className="form-help">No hay tipos de documento activos disponibles.</p>}
  </div>;
}
