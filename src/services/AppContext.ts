import type { AppContext } from "../uiTypes";
import { createContext, useContext } from "react";

// Estado compartido del espacio de trabajo. Los módulos acceden mediante useApp.
export const Context = createContext<AppContext | null>(null);

export const useApp = () => {
  const context = useContext(Context);
  if (!context) throw new Error("Falta el proveedor de NEXA.");
  return context;
};
