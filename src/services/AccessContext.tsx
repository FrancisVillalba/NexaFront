import { createContext, useContext } from "react";

// Los botones compartidos consumen este contexto sin depender del componente App.
export const AccessContext = createContext<(code: string) => boolean>(
  () => false,
);
export const useAccess = () => useContext(AccessContext);
