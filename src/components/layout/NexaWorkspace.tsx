import { WorkspacePage } from "./WorkspacePage";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { usePaymentActions } from "../../modulos/ventas/ventasCobrosAcciones";
import { useContactActions } from "../../modulos/contactos/contactosAcciones";
import { useMovementActions } from "../../modulos/movimientos/movimientosAcciones";
import { useProductActions } from "../../modulos/inventario/inventarioProductosAcciones";
import type { Invoice } from "../../types/commercial";
import type { FormField, FormValues, FormModel, ModalModel } from "../../uiTypes";
import type { CommercialState, CartItem } from "../../types";
import { useState, useEffect } from "react";
import * as I from "../../icons";
import { Login } from "../../modulos/autenticacion/autenticacionInicioSesion";
import { IconButton, Modal } from "../ui";
import { useAuth } from "../../modulos/autenticacion/autenticacionSesion";
import { hasAccess, routeAccess } from "../../services/accessControl";
import { AccessContext } from "../../services/AccessContext";
import { TODAY } from "../../services/commercialConfig";
import { uid } from "../../services/commercialValidation";
import { Context } from "../../services/AppContext";
import { cn } from "../shared/helpers";
import { Button } from "../shared/Button";
import { FormModal } from "../shared/FormModal";
import { InvoiceModal } from "../../modulos/ventas/ventasFacturaModal";
import { PurchaseModal } from "../../modulos/compras/comprasModal";
import { PurchaseDetail } from "../../modulos/compras/comprasDetalle";
import { Statement } from "../../modulos/contactos/contactosEstadoCuenta";
import { navigation, administrationNavigation } from "./navigation";
import { loadCommercialState, saveCommercialState } from "../../services/commercialStorage";

// Coordina la sesión, el menú, los datos y la apertura de pantallas y modales.
export function NexaWorkspace() {
  const { user, loading, authError, completeLogin, logout } = useAuth();
  const can = (code: string) => hasAccess(user, code);
  const [data, setData] = useState<CommercialState>(loadCommercialState),
    [route, setRoute] = useState("inicio"),
    [warehouse, setWarehouse] = useState("Casa central"),
    [modal, setModal] = useState<ModalModel | null>(null),
    [toast, setToast] = useState<{ text: string; error: boolean } | null>(null),
    [collapsed, setCollapsed] = useState(false),
    // Abrir el grupo no navega: solo muestra u oculta los cuatro accesos hijos.
    [administrationOpen, setAdministrationOpen] = useState(false),
    [topMenu, setTopMenu] = useState(""),
    [globalSearch, setGlobalSearch] = useState(""),
    [inventoryQuery, setInventoryQuery] = useState(""),
    [inventoryFilter, setInventoryFilter] = useState("Todos"),
    [cart, setCart] = useState<CartItem[]>([]),
    [saleClient, setSaleClient] = useState("c1"),
    [saleDiscount, setSaleDiscount] = useState(0);
  useEffect(() => {
    saveCommercialState(data);
  }, [data]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (!user) {
      setModal(null);
      setCart([]);
      setRoute("inicio");
      setTopMenu("");
      setAdministrationOpen(false);
    }
  }, [user]);
  useEffect(() => {
    if (!user) return;
    if (!hasAccess(user, routeAccess(route))) {
      const first =
        [...navigation, ...administrationNavigation].find(([id]) =>
          hasAccess(user, routeAccess(id)),
        )?.[0] ?? "sin-accesos";
      if (first !== route) setRoute(first);
      setModal(null);
      setCart([]);
    }
  }, [user, route]);
  useEffect(() => {
    setModal(null);
  }, [user?.accesses.join("|")]);
  function notify(text: string, error = false) {
    setToast({ text, error });
  }
  function go(page: string) {
    const permitted = can(routeAccess(page));
    if (!permitted) {
      notify("Este módulo requiere otro perfil de acceso.", true);
      return;
    }
    setRoute(page);
    if (administrationNavigation.some(([id]) => id === page))
      setAdministrationOpen(true);
    setTopMenu("");
    if (window.innerWidth < 900) setCollapsed(true);
    window.scrollTo(0, 0);
  }
  function commit(next: CommercialState, msg: string) {
    next.audit = [
      { id: uid(), date: TODAY, user: user!.name, action: msg },
      ...(data.audit || []),
    ].slice(0, 100);
    setData(next);
    if (msg) notify(msg);
  }
  function act(fn: (state: CommercialState) => CommercialState, msg: string) {
    try {
      commit(fn(data), msg);
      return true;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
        true,
      );
      return false;
    }
  }
  function form(
    title: string,
    fields: FormField[],
    values: FormValues,
    onSave: FormModel["onSave"],
    help?: string,
    submit?: string,
  ) {
    setModal({ kind: "form", title, fields, values, onSave, help, submit });
  }
  function confirm(title: string, text: string, onConfirm: () => void) {
    setModal({ kind: "confirm", title, text, onConfirm });
  }

  

  function viewInvoice(inv: Invoice) {
    setModal({ kind: "invoice", id: inv.id });
  }

  function openSale() {
    setCart([]);
    setSaleDiscount(0);
    setSaleClient("c1");
    go("nueva-venta");
  }
  const { productForm } = useProductActions({ data, can, notify, commit, form });
  const { movementForm } = useMovementActions({ data, can, notify, commit, form, warehouse, user });
  const { contactForm } = useContactActions({ data, can, notify, commit, form });
  const { pay } = usePaymentActions({ data, can, notify, commit, form });
  const ctx = {
    can,
    data,
    user,
    warehouse,
    go,
    commit,
    act,
    notify,
    form,
    confirm,
    modal,
    setModal,
    productForm,
    movementForm,
    contactForm,
    viewInvoice,
    pay,
    openSale,
    inventoryQuery,
    setInventoryQuery,
    inventoryFilter,
    setInventoryFilter,
    cart,
    setCart,
    saleClient,
    setSaleClient,
    saleDiscount,
    setSaleDiscount,
    setWarehouse,
  };
  if (loading)
    return (
      <div className="loading">
        <I.Box size={40} />
        <p>Preparando tu espacio de trabajo…</p>
      </div>
    );
  if (!user)
    return (
      <Login
        initialError={authError}
        onLogin={(u) => {
          completeLogin(u);
          setRoute(
            [...navigation, ...administrationNavigation].find(([id]) =>
              hasAccess(u, routeAccess(id)),
            )?.[0] ?? "sin-accesos",
          );
        }}
      />
    );
  const allowed = [...navigation, ...administrationNavigation]
      .filter(([id]) => can(routeAccess(id)))
      .map(([id]) => id),
    current =
      [...navigation, ...administrationNavigation].find(
        (n) => n[0] === route,
      )?.[1] ||
      (route === "nueva-venta"
        ? "Nueva venta"
        : route === "nuevo-presupuesto"
          ? "Nuevo presupuesto"
          : "Inicio");
  return (
    <AccessContext.Provider value={can}>
      <Context.Provider value={{ ...ctx, user }}>
        <div className={cn("shell", collapsed && "collapsed")}>
          <WorkspaceSidebar
                allowed={allowed}
                route={route}
                go={go}
                collapsed={collapsed}
                data={data}
                administrationOpen={administrationOpen}
                setAdministrationOpen={setAdministrationOpen}
              />
          <div className="main-shell">
            <WorkspaceHeader
                setCollapsed={setCollapsed}
                collapsed={collapsed}
                route={route}
                current={current}
                can={can}
                setInventoryQuery={setInventoryQuery}
                globalSearch={globalSearch}
                go={go}
                setGlobalSearch={setGlobalSearch}
                warehouse={warehouse}
                setWarehouse={setWarehouse}
                setTopMenu={setTopMenu}
                topMenu={topMenu}
                data={data}
                setInventoryFilter={setInventoryFilter}
                user={user}
                logout={logout}
              />
            <WorkspacePage
                can={can}
                route={route}
                user={user}
              />
            <footer>
              <span>
                <b>NEXA</b> · {data.settings.company}
              </span>
              <span>
                Datos de ejemplo <span className="footer-sep">|</span> 26 oct.
                2026
              </span>
            </footer>
          </div>
          {toast && (
            <div
              role="status"
              className={cn("toast", toast.error && "toast-error")}
            >
              {toast.error ? (
                <I.AlertTriangle size={20} />
              ) : (
                <I.CircleCheck size={20} />
              )}
              <span>{toast.text}</span>
              <IconButton
                icon={I.X}
                label="Cerrar mensaje"
                onClick={() => setToast(null)}
              />
            </div>
          )}
          {modal?.kind === "form" && (
            <FormModal
              key={modal.title}
              model={modal}
              onClose={() => setModal(null)}
            />
          )}{" "}
          {modal?.kind === "confirm" && (
            <Modal title={modal.title} onClose={() => setModal(null)}>
              <p className="confirm-text">{modal.text}</p>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setModal(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    try {
                      modal.onConfirm();
                      setModal(null);
                    } catch (e) {
                      notify(
                        e instanceof Error
                          ? e.message
                          : "No se pudo completar la operación.",
                        true,
                      );
                    }
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </Modal>
          )}
          {modal?.kind === "invoice" && <InvoiceModal id={modal.id} />}{" "}
          {modal?.kind === "purchase" && <PurchaseModal />}
          {modal?.kind === "purchase-detail" && (
            <PurchaseDetail id={modal.id} />
          )}{" "}
          {modal?.kind === "statement" && <Statement id={modal.id} />}
        </div>
      </Context.Provider>
    </AccessContext.Provider>
  );
}
