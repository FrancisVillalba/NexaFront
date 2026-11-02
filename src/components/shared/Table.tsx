import type { ReactNode } from "react";
import { Empty } from "./Empty";

// Estructura de tabla y estado vacío compartidos.
export function Table({
  headers,
  children,
  empty = false,
}: {
  headers: string[];
  children?: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <Empty />}
    </div>
  );
}
