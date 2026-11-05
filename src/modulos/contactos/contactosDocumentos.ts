// La API devuelve la descripción del catálogo o la copia histórica del comprobante.
export function documentoTipoNombre(tipo: string | null | undefined) {
  return tipo?.trim() || "Sin definir";
}
