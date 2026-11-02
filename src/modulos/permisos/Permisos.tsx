import { useEffect, useRef, useState } from "react";
import { Field } from "../../components/ui";
import * as I from "../../icons";
import type { ProfileDto } from "../../types";
import {
  loadAccessCatalog,
  loadProfileAccess,
  loadProfiles,
  moduleNames,
  saveProfileAccess,
} from "./permisosServicio";
import type { AccessDefinition, ProfileAccess } from "./permisosServicio";

const message = (failure: unknown) =>
  failure instanceof Error
    ? failure.message
    : "No se pudo completar la operación.";
const sameCodes = (left: string[], right: string[]) =>
  [...left].sort().join("|") === [...right].sort().join("|");

export function Permissions() {
  const [profiles, setProfiles] = useState<ProfileDto[]>([]);
  const [catalog, setCatalog] = useState<AccessDefinition[]>([]);
  const [selected, setSelected] = useState("");
  const [model, setModel] = useState<ProfileAccess | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingCatalog(true);
    setCatalogError("");
    Promise.all([
      loadProfiles(controller.signal),
      loadAccessCatalog(controller.signal),
    ])
      .then(([profiles, catalog]) => {
        if (controller.signal.aborted) return;
        setProfiles(profiles);
        setCatalog(catalog);
        setSelected((previous) =>
          profiles.some((profile) => String(profile.id) === previous)
            ? previous
            : String(
                (
                  profiles.find((profile) => profile.nombre === "Operador") ??
                  profiles[0]
                )?.id ?? "",
              ),
        );
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setCatalogError(message(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCatalog(false);
      });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    if (!selected) {
      setModel(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setNotice("");
    setModel(null);
    loadProfileAccess(Number(selected), controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setModel(result);
          setCodes(result.codigos);
        }
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(message(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selected, revision]);

  const dirty = model !== null && !sameCodes(codes, model.codigos);
  const modules = [...new Set(catalog.map((access) => access.modulo))];
  const blocked =
    saving || loading || loadingCatalog || model?.administrador !== false;

  function confirmDiscard() {
    return (
      !dirty || window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")
    );
  }

  function toggle(access: AccessDefinition, enabled: boolean) {
    // Set evita códigos repetidos. Al habilitar una acción también se habilita Ver.
    // Si se quita Ver, se quitan las acciones del mismo módulo para no dejar permisos inconsistentes.
    setCodes((previous) => {
      const next = new Set(previous);
      if (enabled) {
        next.add(access.codigo);
        next.add(access.modulo + ".ver");
      } else if (access.accion === "ver")
        catalog
          .filter((item) => item.modulo === access.modulo)
          .forEach((item) => next.delete(item.codigo));
      else next.delete(access.codigo);
      return [...next];
    });
    setNotice("");
  }

  async function save() {
    if (!model || blocked || pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      // La versión permite al servidor detectar si otra persona guardó mientras editábamos.
      const result = await saveProfileAccess(
        model.perfilId,
        codes,
        model.version,
      );
      setModel(result);
      setCodes(result.codigos);
      setNotice(
        "Accesos guardados. Los usuarios recibirán la nueva configuración automáticamente.",
      );
    } catch (failure) {
      setError(message(failure));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Permisos</h1>
          <p>Elegí un perfil y configurá sus accesos por módulo y acción.</p>
        </div>
        <div className="page-actions">
          <button
            className="btn secondary"
            disabled={saving || loading || loadingCatalog}
            onClick={() => {
              if (confirmDiscard()) setRevision((value) => value + 1);
            }}
          >
            <I.Refresh size={18} />
            Actualizar
          </button>
          <button className="btn" disabled={blocked || !dirty} onClick={save}>
            <I.Check size={18} />
            {saving ? "Guardando…" : "Guardar accesos"}
          </button>
        </div>
      </div>
      <div className="filter-bar">
        <Field label="Perfil" required>
          <select
            required
            disabled={saving || loadingCatalog}
            value={selected}
            onChange={(event) => {
              if (confirmDiscard()) setSelected(event.target.value);
            }}
          >
            <option value="">Seleccionar perfil</option>
            {profiles.map((profile) => (
              <option value={profile.id} key={profile.id}>
                {profile.nombre}
                {!profile.activo ? " (inactivo)" : ""}
              </option>
            ))}
          </select>
        </Field>
        {dirty && <span className="badge orange">Cambios sin guardar</span>}
      </div>
      {notice && (
        <p className="info-strip" role="status">
          <I.CircleCheck size={19} />
          {notice}
        </p>
      )}
      {(catalogError || error) && (
        <div className="error" role="alert">
          {catalogError || error}
        </div>
      )}
      {loading || loadingCatalog ? (
        <p role="status">Cargando accesos…</p>
      ) : (
        model &&
        !catalogError && (
          <>
            {model.administrador && (
              <p className="info-strip">
                <I.ShieldCheck size={19} />
                Administrador tiene acceso completo protegido. Sus permisos no
                se pueden quitar.
              </p>
            )}
            <section className="panel" aria-label="Accesos del perfil">
              <div className="table-wrap">
                <table className="access-matrix">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      <th>Ver</th>
                      <th>Crear</th>
                      <th>Editar</th>
                      <th>Otras acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => {
                      const entries = catalog.filter(
                        (access) => access.modulo === module,
                      );
                      function checkbox(access?: AccessDefinition) {
                        if (!access) return <span className="muted">—</span>;
                        const exclusive =
                          access.exclusivoAdministrador &&
                          !model!.administrador;
                        return (
                          <label className="access-option" key={access.codigo}>
                            <input
                              type="checkbox"
                              aria-label={`${moduleNames[module] ?? module}: ${access.nombre}`}
                              checked={codes.includes(access.codigo)}
                              disabled={blocked || exclusive}
                              onChange={(event) =>
                                toggle(access, event.target.checked)
                              }
                            />
                            {!["ver", "crear", "editar"].includes(
                              access.accion,
                            ) && <span>{access.nombre}</span>}
                          </label>
                        );
                      }
                      return (
                        <tr key={module}>
                          <td>
                            <b>{moduleNames[module] ?? module}</b>
                            {entries[0]?.exclusivoAdministrador && (
                              <small className="block">
                                Exclusivo de Administrador
                              </small>
                            )}
                          </td>
                          {["ver", "crear", "editar"].map((action) => (
                            <td key={action}>
                              {checkbox(
                                entries.find(
                                  (access) => access.accion === action,
                                ),
                              )}
                            </td>
                          ))}
                          <td>
                            <div className="access-options">
                              {entries
                                .filter(
                                  (access) =>
                                    !["ver", "crear", "editar"].includes(
                                      access.accion,
                                    ),
                                )
                                .map(checkbox)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            <p className="muted">
              Los perfiles sin accesos no podrán abrir módulos. La
              administración del sistema permanece reservada a Administrador.
            </p>
          </>
        )
      )}
    </>
  );
}
