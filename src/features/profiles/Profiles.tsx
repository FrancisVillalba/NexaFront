import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import * as I from "../../icons";
import type { ProfileDto } from "../../types";
import {
  changeProfileStatus,
  isProtectedProfile,
  listProfiles,
  PROFILES_PAGE_SIZE,
  saveProfile,
} from "./profilesService";
import type { ProfileInput, ProfilesQuery } from "./profilesService";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la operación.";
type Dialog =
  | { kind: "edit"; profile: ProfileDto | null }
  | { kind: "status"; profile: ProfileDto };

export function Profiles() {
  // Cada estado tiene una responsabilidad: datos, filtros, carga, mensajes y diálogo abierto.
  const [profiles, setProfiles] = useState<ProfileDto[]>([]);
  const [query, setQuery] = useState<ProfilesQuery>({
    pagina: 1,
    buscar: "",
    activo: "todos",
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  useEffect(() => {
    // El efecto consulta PostgreSQL a través de la API. Al salir o cambiar el filtro,
    // la limpieza cancela la petición para no mostrar respuestas desactualizadas.
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listProfiles(query, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setProfiles(result);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, revision]);

  function refresh(message: string) {
    setDialog(null);
    setNotice(message);
    // Se vuelve a leer el servidor después de guardar, sin recargar la aplicación.
    setRevision((previous) => previous + 1);
  }

  function searchProfiles(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery((previous) => ({ ...previous, buscar: search.trim(), pagina: 1 }));
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Perfiles</h1>
          <p>Administrá los perfiles asignados a las cuentas de usuario.</p>
        </div>
        <div className="page-actions">
          <button
            className="btn secondary"
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            <I.Refresh size={18} />
            Actualizar
          </button>
          <button
            className="btn"
            onClick={() => {
              setNotice("");
              setDialog({ kind: "edit", profile: null });
            }}
          >
            <I.Plus size={18} />
            Nuevo perfil
          </button>
        </div>
      </div>
      {notice && (
        <p className="info-strip" role="status">
          <I.CircleCheck size={19} />
          {notice}
        </p>
      )}
      <form className="filter-bar" onSubmit={searchProfiles}>
        <div className="search">
          <I.Search size={19} />
          <input
            aria-label="Buscar perfiles"
            placeholder="Nombre o descripción…"
            maxLength={200}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button className="btn secondary" type="submit">
          Buscar
        </button>
        <Field label="Estado">
          <select
            value={query.activo}
            onChange={(event) => {
              const activo = event.target.value;
              if (activo === "todos" || activo === "true" || activo === "false")
                setQuery((previous) => ({ ...previous, activo, pagina: 1 }));
            }}
          >
            <option value="todos">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </Field>
      </form>
      <section
        className="panel"
        aria-label="Listado de perfiles"
        aria-busy={loading}
      >
        {loading ? (
          <p role="status">Cargando perfiles…</p>
        ) : error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td>
                        <b>{profile.nombre}</b>
                        {isProtectedProfile(profile.nombre) && (
                          <small className="block">Nombre protegido</small>
                        )}
                      </td>
                      <td>{profile.descripcion || "—"}</td>
                      <td>
                        <span
                          className={`badge ${profile.activo ? "green" : "gray"}`}
                        >
                          {profile.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn outline small profile-action"
                            aria-label={`Editar perfil ${profile.nombre}`}
                            onClick={() => {
                              setNotice("");
                              setDialog({ kind: "edit", profile });
                            }}
                          >
                            <I.Edit size={16} />
                            Editar
                          </button>
                          <button
                            className={`btn small profile-action ${profile.activo ? "danger-outline" : "outline"}`}
                            disabled={
                              profile.nombre === "Administrador" &&
                              profile.activo
                            }
                            title={
                              profile.nombre === "Administrador"
                                ? "El perfil Administrador no se puede desactivar."
                                : undefined
                            }
                            aria-label={`${profile.activo ? "Desactivar" : "Activar"} perfil ${profile.nombre}`}
                            onClick={() => {
                              setNotice("");
                              setDialog({ kind: "status", profile });
                            }}
                          >
                            {profile.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!profiles.length && (
                <p className="empty">
                  No hay perfiles para los filtros seleccionados.
                </p>
              )}
            </div>
            <div className="pagination">
              <small>
                Página {query.pagina} · {profiles.length} registros
              </small>
              <div>
                <button
                  className="btn secondary"
                  disabled={query.pagina === 1}
                  onClick={() =>
                    setQuery((previous) => ({
                      ...previous,
                      pagina: previous.pagina - 1,
                    }))
                  }
                >
                  Anterior
                </button>
                <button
                  className="btn secondary"
                  disabled={profiles.length < PROFILES_PAGE_SIZE}
                  onClick={() =>
                    setQuery((previous) => ({
                      ...previous,
                      pagina: previous.pagina + 1,
                    }))
                  }
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <p className="muted">
        Administrador conserva su nombre y acceso completo. Configurá los demás
        perfiles desde Administración → Permisos.
      </p>
      {/* El padre entrega datos y callbacks al formulario mediante props. */}
      {dialog?.kind === "edit" && (
        <ProfileForm
          profile={dialog.profile}
          onClose={() => setDialog(null)}
          onSaved={() =>
            refresh(dialog.profile ? "Perfil actualizado." : "Perfil creado.")
          }
        />
      )}
      {dialog?.kind === "status" && (
        <ProfileStatus
          profile={dialog.profile}
          onClose={() => setDialog(null)}
          onSaved={() =>
            refresh(
              dialog.profile.activo
                ? "Perfil desactivado."
                : "Perfil activado.",
            )
          }
        />
      )}
    </>
  );
}

interface ProfileFormProps {
  profile: ProfileDto | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProfileForm({ profile, onClose, onSaved }: ProfileFormProps) {
  const [values, setValues] = useState<ProfileInput>({
    nombre: profile?.nombre ?? "",
    descripcion: profile?.descripcion ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const protectedName = profile !== null && isProtectedProfile(profile.nombre);
  const close = () => {
    if (!pending.current) onClose();
  };

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // El ref bloquea un segundo envío inmediatamente, sin esperar otro renderizado.
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await saveProfile(values, profile?.id);
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal title={profile ? "Editar perfil" : "Nuevo perfil"} onClose={close}>
      <p className="form-help">
        El nombre es obligatorio y debe ser único. La descripción es opcional.
      </p>
      {protectedName && (
        <p className="form-help">
          Este nombre está protegido. Podés modificar la descripción.
        </p>
      )}
      {!profile && (
        <p className="form-help">
          Asigná los accesos del perfil desde Administración → Permisos después
          de crearlo.
        </p>
      )}
      <form onSubmit={submit}>
        <div className="form-stack">
          <Field
            label="Nombre"
            required
            maxLength={50}
            readOnly={protectedName}
            disabled={saving}
            value={values.nombre}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                nombre: event.target.value,
              }))
            }
          />
          <Field
            label="Descripción"
            maxLength={250}
            disabled={saving}
            value={values.descripcion}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                descripcion: event.target.value,
              }))
            }
          />
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={saving}
            onClick={close}
          >
            Cancelar
          </button>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar perfil"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProfileStatus({
  profile,
  onClose,
  onSaved,
}: Omit<ProfileFormProps, "profile"> & { profile: ProfileDto }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const close = () => {
    if (!pending.current) onClose();
  };
  async function confirm() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await changeProfileStatus(profile.id, !profile.activo);
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return (
    <Modal
      title={profile.activo ? "Desactivar perfil" : "Activar perfil"}
      onClose={close}
    >
      <p className="confirm-text">
        ¿Querés {profile.activo ? "desactivar" : "activar"} el perfil{" "}
        <b>{profile.nombre}</b>?
      </p>
      <p>
        {profile.activo
          ? "Los usuarios con este perfil dejarán de tener acceso al sistema. Se conservarán el perfil y sus relaciones."
          : "Los usuarios con este perfil podrán ingresar si su cuenta y su persona también están activas."}
      </p>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <button className="btn secondary" disabled={saving} onClick={close}>
          Cancelar
        </button>
        <button
          className={`btn ${profile.activo ? "danger-outline" : ""}`}
          disabled={saving}
          onClick={confirm}
        >
          {saving ? "Guardando…" : "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
