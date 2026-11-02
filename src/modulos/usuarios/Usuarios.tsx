import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import * as I from "../../icons";
import type { DirectoryUser, UserDirectory } from "../../types";
import {
  changeUserPassword,
  changeUserStatus,
  loadUserDirectory,
  saveUser,
} from "../../services/usuariosServicio";

type Dialog =
  | { kind: "edit"; user: DirectoryUser | null }
  | { kind: "status" | "password"; user: DirectoryUser };
const PAGE_SIZE = 20;
const message = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la operación.";

export function Users({ currentUserId }: { currentUserId: number }) {
  const [directory, setDirectory] = useState<UserDirectory>({
    users: [],
    people: [],
    profiles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  useEffect(() => {
    // La API se pagina internamente. Se reúnen usuarios, personas y perfiles para mostrar
    // los nombres y ofrecer solamente personas activas sin cuenta en el formulario de alta.
    const controller = new AbortController();
    setLoading(true);
    setError("");
    loadUserDirectory(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDirectory(result);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(message(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  const available = directory.people.filter(
    (person) =>
      person.activo &&
      !directory.users.some((user) => user.personId === person.id),
  );
  const activeProfiles = directory.profiles.filter((profile) => profile.activo);
  const activeAdmins = directory.users.filter(
    (user) =>
      user.active &&
      user.personActive &&
      user.profileActive &&
      user.role === "Administrador",
  );
  const query = search.trim().toLowerCase();
  // Estos valores se calculan durante el render; no hace falta otro efecto para filtrar arrays.
  const filtered = directory.users.filter(
    (user) =>
      `${user.username} ${user.name} ${user.document ?? ""}`
        .toLowerCase()
        .includes(query) &&
      (status === "todos" || user.active === (status === "activos")),
  );
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function refresh(text: string) {
    setDialog(null);
    setNotice(text);
    setRevision((value) => value + 1);
  }
  function open(next: Dialog) {
    setNotice("");
    setDialog(next);
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Usuarios</h1>
          <p>Administrá las cuentas y sus perfiles de acceso.</p>
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
            disabled={
              loading || !!error || !available.length || !activeProfiles.length
            }
            onClick={() => open({ kind: "edit", user: null })}
          >
            <I.Plus size={18} />
            Nuevo usuario
          </button>
        </div>
      </div>
      {notice && (
        <p className="info-strip" role="status">
          <I.CircleCheck size={19} />
          {notice}
        </p>
      )}
      <div className="filter-bar">
        <div className="search">
          <I.Search size={19} />
          <input
            aria-label="Buscar usuarios"
            placeholder="Usuario, persona o documento…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Field label="Estado">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </Field>
      </div>
      <section
        className="panel"
        aria-label="Listado de usuarios"
        aria-busy={loading}
      >
        {loading ? (
          <p role="status">Cargando usuarios…</p>
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
                    <th>Persona</th>
                    <th>Usuario</th>
                    <th>Perfil</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <b>{user.name}</b>
                        <small className="block">
                          {user.document || "Sin documento"}
                        </small>
                      </td>
                      <td>
                        {user.username}
                        {user.id === currentUserId && (
                          <small className="block">Tu cuenta</small>
                        )}
                      </td>
                      <td>{user.role}</td>
                      <td>
                        <span
                          className={`badge ${user.active ? "green" : "gray"}`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                        {!user.personActive && (
                          <small className="block">Persona inactiva</small>
                        )}
                        {!user.profileActive && (
                          <small className="block">Perfil inactivo</small>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn outline small user-action"
                            aria-label={`Editar usuario ${user.username}`}
                            onClick={() => open({ kind: "edit", user })}
                          >
                            <I.Edit size={16} />
                            Editar
                          </button>
                          <button
                            className="btn outline small user-action"
                            aria-label={`Cambiar contraseña de ${user.username}`}
                            onClick={() => open({ kind: "password", user })}
                          >
                            Contraseña
                          </button>
                          <button
                            className={`btn small user-action ${user.active ? "danger-outline" : "outline"}`}
                            disabled={
                              user.active &&
                              user.role === "Administrador" &&
                              user.personActive &&
                              user.profileActive &&
                              activeAdmins.length === 1
                            }
                            title={
                              user.active &&
                              user.role === "Administrador" &&
                              activeAdmins.length === 1
                                ? "No se puede desactivar al último administrador activo."
                                : undefined
                            }
                            aria-label={`${user.active ? "Desactivar" : "Activar"} usuario ${user.username}`}
                            onClick={() => open({ kind: "status", user })}
                          >
                            {user.active ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && (
                <p className="empty">
                  No hay usuarios para los filtros seleccionados.
                </p>
              )}
            </div>
            <div className="pagination">
              <small>
                Página {page} · {filtered.length} usuarios
              </small>
              <div>
                <button
                  className="btn secondary"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Anterior
                </button>
                <button
                  className="btn secondary"
                  disabled={page * PAGE_SIZE >= filtered.length}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {!loading && !error && (!available.length || !activeProfiles.length) && (
        <p className="muted">
          Para crear una cuenta necesitás una persona activa sin usuario y un
          perfil activo.
        </p>
      )}
      {/* Props transporta los datos al diálogo; los callbacks avisan al padre cuándo recargar. */}
      {dialog?.kind === "edit" && (
        <UserForm
          user={dialog.user}
          directory={directory}
          ownAccount={dialog.user?.id === currentUserId}
          onClose={() => setDialog(null)}
          onSaved={() =>
            refresh(dialog.user ? "Usuario actualizado." : "Usuario creado.")
          }
        />
      )}
      {dialog?.kind === "status" && (
        <UserStatus
          user={dialog.user}
          ownAccount={dialog.user.id === currentUserId}
          onClose={() => setDialog(null)}
          onSaved={() =>
            refresh(
              dialog.user.active ? "Usuario desactivado." : "Usuario activado.",
            )
          }
        />
      )}
      {dialog?.kind === "password" && (
        <PasswordForm
          user={dialog.user}
          ownAccount={dialog.user.id === currentUserId}
          onClose={() => setDialog(null)}
          onSaved={() =>
            refresh(
              "Contraseña actualizada. Las sesiones anteriores dejaron de ser válidas.",
            )
          }
        />
      )}
    </>
  );
}

interface DialogProps {
  onClose: () => void;
  onSaved: () => void;
  ownAccount: boolean;
}

// Hook compartido por los tres diálogos: bloquea dobles envíos y muestra errores del backend.
function useUserMutation(onClose: () => void, onSaved: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const close = () => {
    if (!pending.current) onClose();
  };
  async function run(action: () => Promise<unknown>) {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await action();
      onSaved();
    } catch (failure) {
      setError(message(failure));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return { saving, error, close, run };
}

function UserForm({
  user,
  directory,
  ownAccount,
  onClose,
  onSaved,
}: DialogProps & { user: DirectoryUser | null; directory: UserDirectory }) {
  const available = directory.people.filter(
    (person) =>
      person.activo &&
      !directory.users.some((account) => account.personId === person.id),
  );
  const profiles = directory.profiles.filter(
    (profile) => profile.activo || profile.id === user?.profileId,
  );
  const [values, setValues] = useState({
    nombreUsuario: user?.username ?? "",
    personaId: String(user?.personId ?? available[0]?.id ?? ""),
    perfilId: String(
      user?.profileId ?? profiles.find((profile) => profile.activo)?.id ?? "",
    ),
    password: "",
    confirmation: "",
  });
  const mutation = useUserMutation(onClose, onSaved);
  function change(field: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.run(async () => {
      if (!user && values.password !== values.confirmation)
        throw new Error("Las contraseñas no coinciden.");
      return saveUser(
        {
          nombreUsuario: values.nombreUsuario,
          personaId: Number(values.personaId),
          perfilId: Number(values.perfilId),
          password: values.password,
        },
        user?.id,
      );
    });
  }
  return (
    <Modal
      title={user ? "Editar usuario" : "Nuevo usuario"}
      onClose={mutation.close}
    >
      <p className="form-help">
        Los campos con asterisco (*) son obligatorios. El nombre de usuario debe
        ser único y no admite espacios.
      </p>
      {ownAccount && (
        <p className="form-help">
          Si cambiás tu usuario o perfil, deberás iniciar sesión nuevamente.
        </p>
      )}
      <form onSubmit={submit}>
        <div className="form-stack">
          {user ? (
            <Field label="Persona vinculada" readOnly value={user.name} />
          ) : (
            <Field label="Persona" required>
              <select
                required
                disabled={mutation.saving}
                value={values.personaId}
                onChange={(event) => change("personaId", event.target.value)}
              >
                <option value="">Seleccionar persona</option>
                {available.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.nombres} {person.apellidos} ·{" "}
                    {person.documento || "Sin documento"}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field
            label="Nombre de usuario"
            required
            maxLength={100}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={mutation.saving}
            value={values.nombreUsuario}
            onChange={(event) => change("nombreUsuario", event.target.value)}
          />
          <Field label="Perfil" required>
            <select
              required
              disabled={mutation.saving}
              value={values.perfilId}
              onChange={(event) => change("perfilId", event.target.value)}
            >
              <option value="">Seleccionar perfil</option>
              {profiles.map((profile) => (
                <option
                  key={profile.id}
                  value={profile.id}
                  disabled={!profile.activo}
                >
                  {profile.nombre}
                  {!profile.activo ? " (inactivo)" : ""}
                </option>
              ))}
            </select>
          </Field>
          {!user && (
            <>
              <Field
                label="Contraseña inicial"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                disabled={mutation.saving}
                value={values.password}
                onChange={(event) => change("password", event.target.value)}
              />
              <Field
                label="Confirmar contraseña"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                disabled={mutation.saving}
                value={values.confirmation}
                onChange={(event) => change("confirmation", event.target.value)}
              />
              <p className="form-help">
                La contraseña debe tener entre 12 y 128 caracteres.
              </p>
            </>
          )}
        </div>
        {mutation.error && (
          <div className="error" role="alert">
            {mutation.error}
          </div>
        )}
        <div className="modal-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={mutation.saving}
            onClick={mutation.close}
          >
            Cancelar
          </button>
          <button className="btn" type="submit" disabled={mutation.saving}>
            {mutation.saving ? "Guardando…" : "Guardar usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UserStatus({
  user,
  ownAccount,
  onClose,
  onSaved,
}: DialogProps & { user: DirectoryUser }) {
  const mutation = useUserMutation(onClose, onSaved);
  return (
    <Modal
      title={user.active ? "Desactivar usuario" : "Activar usuario"}
      onClose={mutation.close}
    >
      <p className="confirm-text">
        ¿Querés {user.active ? "desactivar" : "activar"} la cuenta{" "}
        <b>{user.username}</b>?
      </p>
      <p>
        {user.active
          ? "La cuenta dejará de tener acceso. Se conservarán sus datos y su persona vinculada."
          : "La persona y el perfil deben estar activos para habilitar el acceso."}
      </p>
      {ownAccount && user.active && (
        <p className="form-help">
          Estás desactivando tu propia cuenta. Tu sesión se cerrará.
        </p>
      )}
      {mutation.error && (
        <div className="error" role="alert">
          {mutation.error}
        </div>
      )}
      <div className="modal-actions">
        <button
          className="btn secondary"
          disabled={mutation.saving}
          onClick={mutation.close}
        >
          Cancelar
        </button>
        <button
          className={`btn ${user.active ? "danger-outline" : ""}`}
          disabled={mutation.saving}
          onClick={() =>
            mutation.run(() => changeUserStatus(user.id, !user.active))
          }
        >
          {mutation.saving ? "Guardando…" : "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}

function PasswordForm({
  user,
  ownAccount,
  onClose,
  onSaved,
}: DialogProps & { user: DirectoryUser }) {
  // Las contraseñas solo viven en este formulario; no se guardan en localStorage ni en el listado.
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const mutation = useUserMutation(onClose, onSaved);
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutation.run(async () => {
      if (password !== confirmation)
        throw new Error("Las contraseñas no coinciden.");
      await changeUserPassword(user.id, password);
    });
  }
  return (
    <Modal
      title={`Cambiar contraseña · ${user.username}`}
      onClose={mutation.close}
    >
      <p className="form-help">
        Usá entre 12 y 128 caracteres. Las sesiones anteriores de esta cuenta
        dejarán de ser válidas.
      </p>
      {ownAccount && (
        <p className="form-help">
          Al guardar, tendrás que ingresar con tu nueva contraseña.
        </p>
      )}
      <form onSubmit={submit}>
        <div className="form-stack">
          <Field
            label="Nueva contraseña"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            disabled={mutation.saving}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Field
            label="Confirmar contraseña"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            disabled={mutation.saving}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        {mutation.error && (
          <div className="error" role="alert">
            {mutation.error}
          </div>
        )}
        <div className="modal-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={mutation.saving}
            onClick={mutation.close}
          >
            Cancelar
          </button>
          <button className="btn" type="submit" disabled={mutation.saving}>
            {mutation.saving ? "Guardando…" : "Guardar contraseña"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
