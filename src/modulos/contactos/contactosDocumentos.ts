export const contactosTiposDocumento = [
  { codigo: "CI", nombre: "Cédula de identidad" },
  { codigo: "RUC", nombre: "RUC" },
  { codigo: "PASAPORTE", nombre: "Pasaporte" },
  { codigo: "OTRO", nombre: "Otro" },
] as const;
export type TipoDocumento = typeof contactosTiposDocumento[number]["codigo"];
export function esTipoDocumento(valor: string): valor is TipoDocumento {
  return contactosTiposDocumento.some(tipo => tipo.codigo === valor);
}
// Los registros anteriores se muestran sin clasificar hasta que el usuario seleccione el tipo.
export function documentoTipoNombre(tipo: string | null | undefined) {
  return contactosTiposDocumento.find(opcion => opcion.codigo === tipo)?.nombre ?? "Sin definir";
}
