import { useEffect, useState } from "react";
import { tiposDocumentoListar } from "./tiposDocumentoServicio";
import type { TipoDocumentoDto } from "./tiposDocumentoTipos";

// Cada formulario consulta el catálogo vigente. No hay lista fija ni alternativa en localStorage.
export function useTiposDocumento(actualId: number | null | undefined) {
  const [items, setItems] = useState<TipoDocumentoDto[]>([]), [cargando, setCargando] = useState(true);
  const [error, setError] = useState(""), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true); setError(""); setItems([]);
    tiposDocumentoListar(controlador.signal).then(res => {
      if (!controlador.signal.aborted) setItems(res.filter(x => x.activo || x.id === actualId));
    }).catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudieron consultar los tipos de documento."); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [actualId, revision]);
  return { items, cargando, error, reintentar: () => setRevision(x => x + 1),
    esValido: (id: number) => !cargando && !error && items.some(x => x.id === id && (x.activo || x.id === actualId)) };
}
