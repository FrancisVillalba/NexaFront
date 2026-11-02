import type { ButtonProps } from "../../uiTypes";
import React from "react";
import { AccessContext } from "../../services/AccessContext";
import { cn } from "./helpers";

// Botón compartido: aplica los permisos recibidos del backend.
export function Button({
  access,
  children,
  icon: Icon,
  variant = "",
  className = "",
  ...props
}: ButtonProps) {
  const can = React.useContext(AccessContext);
  if (access && !(Array.isArray(access) ? access : [access]).every(can))
    return null;
  return (
    <button className={cn("btn", variant, className)} {...props}>
      {Icon && <Icon size={18} />} {children}
    </button>
  );
}
