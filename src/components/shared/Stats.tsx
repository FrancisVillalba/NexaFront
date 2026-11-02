import type { Icon } from "../../uiTypes";
import type { ReactNode } from "react";

// Indicadores resumidos para paneles y reportes.
export function Stat({
  label,
  value,
  note,
  icon: Icon,
  color = "blue",
  onClick,
}: {
  label: string;
  value: ReactNode;
  note: string;
  icon: Icon;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button className={"stat " + color} onClick={onClick} disabled={!onClick}>
      <span className="stat-icon">
        <Icon size={28} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </button>
  );
}

export function MiniStats({ items }: { items: [string, ReactNode, Icon, string?][] }) {
  return (
    <div className="mini-stats">
      {items.map(([label, value, Icon, color]) => (
        <div key={label}>
          <span className={"soft-icon " + (color || "blue")}>
            <Icon size={23} />
          </span>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
