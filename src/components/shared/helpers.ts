
// Utilidades compartidas sin dependencias de las pantallas.
export function requireRecord<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(label + " inexistente.");
  return value;
}

export const cn = (...a: (string | false | undefined)[]) =>
  a.filter(Boolean).join(" ");
