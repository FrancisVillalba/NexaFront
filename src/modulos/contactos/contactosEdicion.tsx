import { contactosTiposDocumento, esTipoDocumento } from "./contactosDocumentos";
import type { TipoDocumento } from "./contactosDocumentos";
import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Field, Modal } from "../../components/ui";
import { Button } from "../../components/shared/Button";
import type { ContactoComercial, ContactosServicio } from "./contactosTipos";

interface Props { servicio: ContactosServicio; contacto: ContactoComercial | null; alCerrar: () => void; alGuardar: () => void; }

// El mismo formulario sirve para particulares y empresas. Cada módulo guarda sus propios datos.
export function ContactosEdicion({ servicio, contacto, alCerrar, alGuardar }: Props) {
  const cliente = servicio.tipo === "clientes";
  const singular = cliente ? "cliente" : "proveedor";
  const [nombre, setNombre] = useState(contacto?.nombreRazonSocial ?? "");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento | "">(contacto?.tipoDocumento ?? "");
  const [documento, setDocumento] = useState(contacto?.documento ?? "");
  const [correo, setCorreo] = useState(contacto?.correo ?? "");
  const [telefono, setTelefono] = useState(contacto?.telefono ?? "");
  const [direccion, setDireccion] = useState(contacto?.direccion ?? "");
  const [observaciones, setObservaciones] = useState(contacto?.observaciones ?? "");
  const [plazo, setPlazo] = useState(String(contacto?.plazoPagoDias ?? 0));
  const [credito, setCredito] = useState(String(contacto?.limiteCredito ?? 0));
  const [guardando, setGuardando] = useState(false), [error, setError] = useState("");
  const pendiente = useRef(false);

  function cerrar() {
    if (pendiente.current) return;
    const cambiado = tipoDocumento !== (contacto?.tipoDocumento ?? "") || nombre !== (contacto?.nombreRazonSocial ?? "") || documento !== (contacto?.documento ?? "")
      || correo !== (contacto?.correo ?? "") || telefono !== (contacto?.telefono ?? "") || direccion !== (contacto?.direccion ?? "")
      || observaciones !== (contacto?.observaciones ?? "") || plazo !== String(contacto?.plazoPagoDias ?? 0)
      || credito !== String(contacto?.limiteCredito ?? 0);
    if (!cambiado || window.confirm("Tenés cambios sin guardar. ¿Querés descartarlos?")) alCerrar();
  }
  async function guardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    setError("");
    const dias = Number(plazo), limite = cliente ? Number(credito) : 0;
    if (!esTipoDocumento(tipoDocumento)) { setError("Seleccioná el tipo de documento."); return; }
    if (!nombre.trim() || !documento.trim()) { setError("Completá el nombre o razón social y el documento / RUC."); return; }
    if (!plazo.trim() || (cliente && !credito.trim()) || !Number.isInteger(dias) || dias < 0 || dias > 365 || !Number.isFinite(limite) || limite < 0) {
      setError("Revisá el plazo de pago y el límite de crédito."); return;
    }
    pendiente.current = true; setGuardando(true);
    try {
      // No se envían PersonaId ni datos de usuarios: el contacto se guarda en su propia tabla.
      await servicio.guardar({ nombreRazonSocial: nombre.trim(), tipoDocumento, documento: documento.trim(), correo, telefono, direccion,
        observaciones, plazoPagoDias: dias, limiteCredito: limite, version: contacto?.version }, contacto?.id);
      alGuardar();
    } catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No se pudo guardar el registro."); }
    finally { pendiente.current = false; setGuardando(false); }
  }
  return <Modal title={(contacto ? "Editar " : "Nuevo ") + singular} onClose={cerrar} wide>
    <form onSubmit={guardar}>
      <div className="form-grid">
        <Field label="Nombre o razón social" required maxLength={300} value={nombre} disabled={guardando} placeholder="Ej.: FERRETERÍA SRL o Juan Pérez" onChange={e => setNombre(e.target.value)} />
        <Field label="Tipo de documento" required><select required value={tipoDocumento} disabled={guardando} onChange={e => { const valor = e.target.value; if (valor === "" || esTipoDocumento(valor)) setTipoDocumento(valor); }}>
          <option value="">Seleccionar tipo de documento</option>{contactosTiposDocumento.map(tipo => <option key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</option>)}
        </select></Field>
        <Field label="Número de documento" required maxLength={30} value={documento} disabled={guardando} onChange={e => setDocumento(e.target.value)} />
        <Field label="Correo" type="email" maxLength={254} value={correo} disabled={guardando} onChange={e => setCorreo(e.target.value)} />
        <Field label="Teléfono" type="tel" maxLength={30} value={telefono} disabled={guardando} onChange={e => setTelefono(e.target.value)} />
        <Field label="Dirección" maxLength={300} value={direccion} disabled={guardando} onChange={e => setDireccion(e.target.value)} />
      </div>
      <h3 className="mt">Datos comerciales</h3>
      <div className="form-grid">
        <Field label="Plazo de pago (días)" required type="number" min={0} max={365} step="1" value={plazo} disabled={guardando} onChange={e => setPlazo(e.target.value)} />
        {cliente && <Field label="Límite de crédito (Gs.)" required type="number" min={0} max={999999999999.99} step="0.01" value={credito} disabled={guardando} onChange={e => setCredito(e.target.value)} />}
        <Field label="Observaciones"><textarea maxLength={500} rows={3} value={observaciones} disabled={guardando} onChange={e => setObservaciones(e.target.value)} /></Field>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><Button type="button" variant="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
        <Button type="submit" access={servicio.tipo + "." + (contacto ? "editar" : "crear")} disabled={guardando}>{guardando ? "Guardando…" : "Guardar " + singular}</Button></div>
    </form>
  </Modal>;
}
