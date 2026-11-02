
// Lógica local de demostración, separada de los componentes de React.
export const money = (v: number | string | undefined) =>
  "Gs. " +
  new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(
    Number(v) || 0,
  );

export const num = (v: number | string | undefined) =>
  new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(
    Number(v) || 0,
  );

export const date = (v: string) =>
  new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(v + "T12:00:00"));

export function csv(filename: string, headers: string[], rows: unknown[][]) {
  const text =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) =>
        row
          .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
          .join(";"),
      )
      .join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
