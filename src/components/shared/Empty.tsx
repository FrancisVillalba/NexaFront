import type { ReactNode } from "react";
import * as I from "../../icons";

// Estado vacío para búsquedas y tablas sin resultados.
export function Empty({
  title = "No hay resultados",
  text = "Probá con otra búsqueda o cambiá los filtros.",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <I.Search size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
