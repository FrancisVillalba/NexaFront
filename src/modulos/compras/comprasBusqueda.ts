import { useEffect, useState } from "react";

// Búsqueda acotada a 20 coincidencias; cancela respuestas viejas y permite reintentar errores.
export function useComprasBusqueda<T>(buscar: string, consultar: (buscar: string, signal?: AbortSignal) => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controlador = new AbortController();
    setItems([]); setError("");
    if (buscar.trim().length < 2) { setCargando(false); return () => controlador.abort(); }
    setCargando(true);
    const temporizador = window.setTimeout(() => {
      consultar(buscar.trim(), controlador.signal).then(datos => { if (!controlador.signal.aborted) setItems(datos); })
        .catch(fallo => { if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : "No se pudo consultar el catálogo."); })
        .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    }, 300);
    return () => { controlador.abort(); window.clearTimeout(temporizador); };
  }, [buscar, consultar, revision]);
  return { items, cargando, error, reintentar: () => setRevision(valor => valor + 1) };
}
