import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import * as I from "../../icons";
import type { PersonDto } from "../../types";
import {
  changePersonStatus,
  listPeople,
  PEOPLE_PAGE_SIZE,
  savePerson,
} from "./peopleService";
import type { PeopleQuery, PersonInput } from "./peopleService";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la operación.";

// Una unión distingue las dos operaciones. Es similar a usar diferentes DTOs en C#.
type Dialog =
  | { kind: "edit"; person: PersonDto | null }
  | { kind: "status"; person: PersonDto };

export function People() {
  // useState conserva valores entre renderizados. Cambiar el estado vuelve a dibujar la pantalla.
  const [people, setPeople] = useState<PersonDto[]>([]);
  const [query, setQuery] = useState<PeopleQuery>({
    pagina: 1,
    buscar: "",
    activo: "todos",
  });
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);

  useEffect(() => {
    // El efecto sincroniza la pantalla con la API cuando cambian los filtros o la página.
    // AbortController cancela la petición anterior: una respuesta vieja no pisa la búsqueda nueva.
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listPeople(query, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPeople(result);
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
    // La revisión fuerza una nueva consulta, sin recargar toda la aplicación ni guardar datos locales.
    setRevision((previous) => previous + 1);
  }

  function searchPeople(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery((previous) => ({ ...previous, buscar: search.trim(), pagina: 1 }));
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Personas</h1>
          <p>Datos personales registrados en NexaBack y PostgreSQL.</p>
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
              setDialog({ kind: "edit", person: null });
            }}
          >
            <I.Plus size={18} />
            Nueva persona
          </button>
        </div>
      </div>

      {notice && (
        <p className="info-strip" role="status">
          <I.CircleCheck size={19} />
          {notice}
        </p>
      )}

      <form className="filter-bar" onSubmit={searchPeople}>
        <div className="search">
          <I.Search size={19} />
          <input
            aria-label="Buscar personas"
            placeholder="Nombre, apellido, documento o correo…"
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
            <option value="todos">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
        </Field>
      </form>

      <section
        className="panel"
        aria-label="Listado de personas"
        aria-busy={loading}
      >
        {loading ? (
          <p role="status">Cargando personas…</p>
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
                    <th>Documento</th>
                    <th>Contacto</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((person) => (
                    <tr key={person.id}>
                      <td>
                        <b>
                          {person.nombres} {person.apellidos}
                        </b>
                      </td>
                      <td>{person.documento || "—"}</td>
                      <td>
                        {person.correo || "—"}
                        <small className="block">
                          {person.telefono || "—"}
                        </small>
                      </td>
                      <td>{person.direccion || "—"}</td>
                      <td>
                        <span
                          className={`badge ${person.activo ? "green" : "gray"}`}
                        >
                          {person.activo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn outline small people-action"
                            aria-label={`Editar a ${person.nombres} ${person.apellidos}`}
                            onClick={() => {
                              setNotice("");
                              setDialog({ kind: "edit", person });
                            }}
                          >
                            <I.Edit size={16} />
                            Editar
                          </button>
                          <button
                            className={`btn small people-action ${person.activo ? "danger-outline" : "outline"}`}
                            aria-label={`${person.activo ? "Desactivar" : "Activar"} a ${person.nombres} ${person.apellidos}`}
                            onClick={() => {
                              setNotice("");
                              setDialog({ kind: "status", person });
                            }}
                          >
                            {person.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!people.length && (
                <p className="empty">
                  No hay personas para los filtros seleccionados.
                </p>
              )}
            </div>
            <div className="pagination">
              <small>
                Página {query.pagina} · {people.length} registros
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
                  disabled={people.length < PEOPLE_PAGE_SIZE}
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

      {/* El padre pasa datos y callbacks por props; el formulario conserva sus propios campos. */}
      {dialog?.kind === "edit" && (
        <PersonForm
          person={dialog.person}
          onClose={() => setDialog(null)}
          onSaved={() =>
            refresh(dialog.person ? "Persona actualizada." : "Persona creada.")
          }
        />
      )}
      {dialog?.kind === "status" && (
        <PersonStatus
          person={dialog.person}
          onClose={() => setDialog(null)}
          onSaved={() =>
            refresh(
              dialog.person.activo
                ? "Persona desactivada."
                : "Persona activada.",
            )
          }
        />
      )}
    </>
  );
}

interface PersonFormProps {
  person: PersonDto | null;
  onClose: () => void;
  onSaved: () => void;
}

function PersonForm({ person, onClose, onSaved }: PersonFormProps) {
  const [values, setValues] = useState<PersonInput>({
    nombres: person?.nombres ?? "",
    apellidos: person?.apellidos ?? "",
    documento: person?.documento ?? "",
    correo: person?.correo ?? "",
    telefono: person?.telefono ?? "",
    direccion: person?.direccion ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Un ref cambia inmediatamente sin esperar un render. Evita envíos dobles y cierres durante el guardado.
  const pending = useRef(false);
  const close = () => {
    if (!pending.current) onClose();
  };

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      // No cerramos el diálogo hasta que el backend confirme el guardado.
      await savePerson(values, person?.id);
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  function change(field: keyof PersonInput, value: string) {
    // Creamos un objeto nuevo. No modificamos directamente el estado anterior de React.
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <Modal
      title={person ? "Editar persona" : "Nueva persona"}
      onClose={close}
      wide
    >
      <p className="form-help">
        Los campos con asterisco (*) son obligatorios. El documento debe ser único.
      </p>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field
            label="Nombres"
            required
            maxLength={100}
            autoComplete="given-name"
            value={values.nombres}
            disabled={saving}
            onChange={(event) => change("nombres", event.target.value)}
          />
          <Field
            label="Apellidos"
            required
            maxLength={100}
            autoComplete="family-name"
            value={values.apellidos}
            disabled={saving}
            onChange={(event) => change("apellidos", event.target.value)}
          />
          <Field
            label="Documento"
            required
            maxLength={30}
            value={values.documento}
            disabled={saving}
            onChange={(event) => change("documento", event.target.value)}
          />
          <Field
            label="Correo"
            type="email"
            maxLength={254}
            autoComplete="email"
            value={values.correo}
            disabled={saving}
            onChange={(event) => change("correo", event.target.value)}
          />
          <Field
            label="Teléfono"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            value={values.telefono}
            disabled={saving}
            onChange={(event) => change("telefono", event.target.value)}
          />
          <Field
            label="Dirección"
            maxLength={300}
            autoComplete="street-address"
            value={values.direccion}
            disabled={saving}
            onChange={(event) => change("direccion", event.target.value)}
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
            {saving ? "Guardando…" : "Guardar persona"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PersonStatus({
  person,
  onClose,
  onSaved,
}: Omit<PersonFormProps, "person"> & { person: PersonDto }) {
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
      await changePersonStatus(person.id, !person.activo);
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
      title={person.activo ? "Desactivar persona" : "Activar persona"}
      onClose={close}
    >
      <p className="confirm-text">
        ¿Querés {person.activo ? "desactivar" : "activar"} a{" "}
        <b>
          {person.nombres} {person.apellidos}
        </b>
        ?
      </p>
      <p>
        {person.activo
          ? "Sus datos se conservarán. Si tiene una cuenta de usuario, dejará de tener acceso al sistema mientras la persona esté inactiva."
          : "La persona volverá a estar disponible. Para ingresar, su usuario y su perfil también deben estar activos."}
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
          className={`btn ${person.activo ? "danger-outline" : ""}`}
          disabled={saving}
          onClick={confirm}
        >
          {saving ? "Guardando…" : "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
