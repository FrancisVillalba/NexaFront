import { cn } from "./helpers";

// Etiqueta visual de estado reutilizada por los módulos.
export function Badge({ children }: { children: string }) {
  return (
    <span
      className={cn(
        "badge",
        (
          {
            Disponible: "green",
            Pagada: "green",
            Recibida: "green",
            Ingreso: "green",
            Activa: "green",
            "Stock bajo": "orange",
            Pendiente: "orange",
            Parcial: "blue",
            "Sin stock": "red",
            Anulada: "red",
            Egreso: "red",
            Inactiva: "gray",
            Borrador: "purple",
          } as Record<string, string>
        )[children] || "blue",
      )}
    >
      {children}
    </span>
  );
}
