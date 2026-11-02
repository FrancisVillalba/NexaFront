import * as I from "../../icons";
import { IconButton } from "../ui";

// Campo de búsqueda compartido.
export function Search({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search">
      <I.Search size={19} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <IconButton
          icon={I.X}
          label="Limpiar búsqueda"
          onClick={() => onChange("")}
        />
      )}
    </div>
  );
}
