import { api } from "../../services/api";
import type { InicioResumen, ReporteDeposito } from "../reportes/reportesTipos";
export const inicioServicio = {
  depositos(signal?: AbortSignal) { return api<ReporteDeposito[]>("/api/inicio/depositos", undefined, { signal }); },
  consultar(depositoId: number | null, signal?: AbortSignal) {
    return api<InicioResumen>("/api/inicio" + (depositoId === null ? "" : "?depositoId=" + depositoId), undefined, { signal });
  },
};
