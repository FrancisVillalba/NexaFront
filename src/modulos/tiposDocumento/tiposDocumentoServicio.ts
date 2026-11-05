import { api } from "../../services/api";
import type { TipoDocumentoDto } from "./tiposDocumentoTipos";
export function tiposDocumentoListar(signal?: AbortSignal) {
  return api<TipoDocumentoDto[]>("/api/tipos-documento", undefined, { signal });
}
