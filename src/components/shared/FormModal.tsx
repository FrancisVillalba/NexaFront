import type { FormModel } from "../../uiTypes";
import { useState } from "react";
import * as I from "../../icons";
import { Field, Modal } from "../ui";
import { Button } from "./Button";

// Formulario modal reutilizable; los campos se definen desde cada operación.
export function FormModal({
  model,
  onClose,
}: {
  model: FormModel;
  onClose: () => void;
}) {
  const [values, setValues] = useState(model.values || {}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title={model.title} onClose={onClose} wide={model.fields.length > 6}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          try {
            await model.onSave(values);
            onClose();
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "No se pudo completar la operación.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {model.help && <p className="form-help">{model.help}</p>}
        <div className={model.fields.length > 4 ? "form-grid" : "form-stack"}>
          {model.fields
            .filter((f) => !f.when || f.when(values))
            .map((f) => (
              <Field
                key={f.name}
                label={f.label}
                required={f.required !== false}
              >
                {f.options ? (
                  <select
                    required={f.required !== false}
                    value={values[f.name] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, [f.name]: e.target.value })
                    }
                  >
                    {f.placeholder && <option value="">{f.placeholder}</option>}
                    {f.options.map((x) => (
                      <option
                        key={typeof x === "object" ? x.value : x}
                        value={typeof x === "object" ? x.value : x}
                      >
                        {typeof x === "object" ? x.label : x}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required={f.required !== false}
                    type={f.type || "text"}
                    min={f.min}
                    max={f.max}
                    step={f.step || "any"}
                    minLength={f.minLength}
                    value={values[f.name] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, [f.name]: e.target.value })
                    }
                  />
                )}
              </Field>
            ))}
        </div>
        {error && (
          <div className="error" role="alert">
            <I.AlertTriangle size={18} />
            {error}
          </div>
        )}
        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={I.Check} disabled={busy}>
            {busy ? "Guardando…" : model.submit || "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
