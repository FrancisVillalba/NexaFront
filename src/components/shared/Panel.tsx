import type { PanelProps } from "../../uiTypes";
import { cn } from "./helpers";

// Contenedor visual compartido.
export function Panel({
  title,
  icon: Icon,
  color = "blue",
  action,
  children,
  className = "",
}: PanelProps) {
  return (
    <section className={cn("panel", className)}>
      {title && (
        <div className="panel-title">
          <h2>
            {Icon && (
              <span className={"title-icon " + color}>
                <Icon size={19} />
              </span>
            )}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
