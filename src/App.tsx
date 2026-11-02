import type { ReactNode } from "react";
import type {
  AppContext,
  ButtonProps,
  FormField,
  FormModel,
  FormValues,
  ModalModel,
  PanelProps,
  Icon,
} from "./uiTypes";
import type {
  CommercialState,
  Product,
  Contact,
  Invoice,
  CartItem,
  PurchaseItem,
} from "./types";
import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import * as I from "./icons";
import { Login } from "./features/auth/Login";
import { People } from "./features/people/People";
import { Profiles } from "./features/profiles/Profiles";
import { Brand, IconButton, Field, Modal } from "./components/ui";
import { useAuth } from "./features/auth/useAuth";
import { Users } from "./features/users/Users";
import { Permissions } from "./features/permissions/Permissions";
import { hasAccess, routeAccess } from "./services/accessControl";
import { AccessContext } from "./services/AccessContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TODAY,
  warehouses,
  categories,
  uid,
  money,
  num,
  date,
  stock,
  status,
  seed,
  applyMovement,
  checkout,
  receivePurchase,
  payInvoice,
  voidInvoice,
  cashExpected,
  csv,
  validQty,
} from "./domain";
function requireRecord<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(label + " inexistente.");
  return value;
}
const Context = createContext<AppContext | null>(null);
const useApp = () => {
  const context = useContext(Context);
  if (!context) throw new Error("Falta el proveedor de NEXA.");
  return context;
};
const STORAGE = "ferro-demo-v1",
  palette = [
    "#0c88f7",
    "#0cafab",
    "#7c43d2",
    "#ff9a08",
    "#18bb66",
    "#ed4554",
    "#586f8e",
  ];
const navigation: [string, string, Icon][] = [
  ["inicio", "Inicio", I.Home],
  ["productos", "Productos", I.Box],
  ["inventario", "Inventario", I.Package],
  ["movimientos", "Movimientos de stock", I.ArrowsExchange],
  ["compras", "Compras", I.ShoppingCart],
  ["ventas", "Ventas y facturación", I.Receipt],
  ["presupuestos", "Presupuestos", I.FileText],
  ["clientes", "Clientes", I.Users],
  ["proveedores", "Proveedores", I.Truck],
  ["reportes", "Reportes", I.ChartBar],
  ["configuracion", "Configuración", I.Settings],
];
// Los accesos administrativos se agrupan visualmente, pero cada uno conserva su ruta.
const administrationNavigation: [string, string, Icon][] = [
  ["personas", "Personas", I.User],
  ["usuarios", "Usuarios", I.Users],
  ["perfiles", "Perfiles", I.ShieldCheck],
  ["permisos", "Permisos", I.Lock],
];
const cn = (...a: (string | false | undefined)[]) =>
  a.filter(Boolean).join(" ");

function Button({
  access,
  children,
  icon: Icon,
  variant = "",
  className = "",
  ...props
}: ButtonProps) {
  const can = React.useContext(AccessContext);
  if (access && !(Array.isArray(access) ? access : [access]).every(can))
    return null;
  return (
    <button className={cn("btn", variant, className)} {...props}>
      {Icon && <Icon size={18} />} {children}
    </button>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span
      className={cn(
        "badge",
        (
          {
            Disponible: "green",
            Pagada: "green",
            Recibida: "green",
            Ingreso: "green",
            Activa: "green",
            "Stock bajo": "orange",
            Pendiente: "orange",
            Parcial: "blue",
            "Sin stock": "red",
            Anulada: "red",
            Egreso: "red",
            Inactiva: "gray",
            Borrador: "purple",
          } as Record<string, string>
        )[children] || "blue",
      )}
    >
      {children}
    </span>
  );
}
function Empty({
  title = "No hay resultados",
  text = "Probá con otra búsqueda o cambiá los filtros.",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <I.Search size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

function Search({
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
function ProductImage({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  const Icon =
    (
      {
        Electricidad: I.Bolt,
        Plomería: I.Droplet,
        Tornillería: I.Tool,
        Construcción: I.Package,
        Seguridad: I.ShieldCheck,
      } as Record<string, Icon>
    )[product.category] || I.Box;
  return (
    <span className={cn("product-image", large && "large")}>
      {product.image ? (
        <img src={"/assets/" + product.image + ".png"} alt={product.name} />
      ) : (
        <Icon size={large ? 64 : 24} />
      )}
    </span>
  );
}
function ProductName({ p }: { p: Product }) {
  return (
    <span className="product-name">
      <ProductImage product={p} />
      <span>
        <b>{p.name}</b>
        <small>
          {p.brand} · {p.unit}
        </small>
      </span>
    </span>
  );
}
function PageTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}
function Panel({
  title,
  icon: Icon,
  color = "blue",
  action,
  children,
  className = "",
}: PanelProps) {
  return (
    <section className={cn("panel", className)}>
      {title && (
        <div className="panel-title">
          <h2>
            {Icon && (
              <span className={"title-icon " + color}>
                <Icon size={19} />
              </span>
            )}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
function Stat({
  label,
  value,
  note,
  icon: Icon,
  color = "blue",
  onClick,
}: {
  label: string;
  value: ReactNode;
  note: string;
  icon: Icon;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button className={"stat " + color} onClick={onClick} disabled={!onClick}>
      <span className="stat-icon">
        <Icon size={28} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </button>
  );
}
function MiniStats({ items }: { items: [string, ReactNode, Icon, string?][] }) {
  return (
    <div className="mini-stats">
      {items.map(([label, value, Icon, color]) => (
        <div key={label}>
          <span className={"soft-icon " + (color || "blue")}>
            <Icon size={23} />
          </span>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
function Table({
  headers,
  children,
  empty = false,
}: {
  headers: string[];
  children?: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <Empty />}
    </div>
  );
}

function FormModal({
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

export function App() {
  const { user, loading, authError, completeLogin, logout } = useAuth();
  const can = (code: string) => hasAccess(user, code);
  const [data, setData] = useState<CommercialState>(() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE) || "null") || seed();
      } catch {
        return seed();
      }
    }),
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
    localStorage.setItem(STORAGE, JSON.stringify(data));
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
  function productForm(p?: Product) {
    if (!can(p ? "productos.editar" : "productos.crear")) {
      notify("No tenés permiso para crear o editar productos.", true);
      return;
    }
    const fields: FormField[] = [
      { name: "name", label: "Nombre del producto" },
      { name: "code", label: "Código / SKU" },
      { name: "barcode", label: "Código de barras", required: false },
      { name: "brand", label: "Marca" },
      { name: "category", label: "Categoría", options: categories },
      {
        name: "unit",
        label: "Unidad de venta",
        options: ["unidad", "caja", "metro", "kilo", "bolsa", "par"],
      },
      { name: "cost", label: "Costo de compra (Gs.)", type: "number", min: 0 },
      { name: "price", label: "Precio de venta (Gs.)", type: "number", min: 1 },
      { name: "min", label: "Stock mínimo", type: "number", min: 0 },
    ];
    if (!p)
      fields.push(
        {
          name: "central",
          label: "Stock inicial · Casa central",
          type: "number",
          min: 0,
        },
        {
          name: "north",
          label: "Stock inicial · Depósito Norte",
          type: "number",
          min: 0,
        },
      );
    form(
      p ? "Editar producto" : "Nuevo producto",
      fields,
      p
        ? {
            name: p.name,
            code: p.code,
            barcode: p.barcode,
            brand: p.brand,
            category: p.category,
            unit: p.unit,
            cost: p.cost,
            price: p.price,
            min: p.min,
          }
        : {
            category: "Herramientas",
            unit: "unidad",
            cost: 0,
            price: 0,
            min: 5,
            central: 0,
            north: 0,
          },
      (v) => {
        const s = structuredClone(data);
        if (
          s.products.some(
            (x) =>
              x.id !== p?.id &&
              x.code.toLowerCase() === String(v.code).trim().toLowerCase(),
          )
        )
          throw Error("Ya existe un producto con ese código.");
        const item: Product = {
          ...p,
          barcode: String(v.barcode ?? ""),
          brand: String(v.brand ?? ""),
          category: String(v.category ?? ""),
          unit: String(v.unit ?? ""),
          id: p?.id || Math.max(...s.products.map((x) => x.id)) + 1,
          name: String(v.name).trim(),
          code: String(v.code).trim(),
          cost: Number(v.cost),
          price: Number(v.price),
          min: Number(v.min),
          stocks: p?.stocks || {
            "Casa central": Number(v.central),
            "Depósito Norte": Number(v.north),
          },
        };
        for (const q of Object.values(item.stocks))
          if (q > 0) validQty(item, q);
        s.products = p
          ? s.products.map((x) => (x.id === p.id ? item : x))
          : [...s.products, item];
        commit(s, p ? "Producto actualizado" : "Producto creado");
      },
      "Los movimientos posteriores se registran desde Movimientos de stock.",
    );
  }
  function movementForm(p?: Product, type = "Entrada") {
    if (!can("movimientos.crear")) {
      notify("No tenés permiso para registrar movimientos de stock.", true);
      return;
    }
    form(
      "Registrar movimiento",
      [
        {
          name: "productId",
          label: "Producto",
          options: data.products.map((x) => ({
            value: x.id,
            label: x.code + " · " + x.name,
          })),
          placeholder: "Seleccionar producto",
        },
        {
          name: "type",
          label: "Tipo de movimiento",
          options: ["Entrada", "Salida", "Ajuste", "Transferencia"],
        },
        { name: "warehouse", label: "Depósito de origen", options: warehouses },
        {
          name: "destination",
          label: "Depósito de destino",
          options: warehouses,
          when: (v) => v.type === "Transferencia",
        },
        { name: "qty", label: "Cantidad", type: "number", min: 0.01 },
        { name: "reason", label: "Motivo / referencia" },
      ],
      {
        productId: p?.id || "",
        type,
        warehouse,
        destination:
          warehouse === warehouses[0] ? warehouses[1] : warehouses[0],
        qty: 1,
        reason: "",
      },
      (v) =>
        commit(
          applyMovement(
            data,
            {
              productId: String(v.productId ?? ""),
              qty: Number(v.qty),
              reason: String(v.reason ?? ""),
              type: String(v.type ?? ""),
              warehouse: String(v.warehouse ?? ""),
              destination: String(v.destination ?? ""),
            },
            user!.name,
          ),
          "Movimiento registrado",
        ),
      "Para reducir existencias, usá Salida. Ajuste registra una corrección positiva.",
    );
  }
  function contactForm(type: string, item?: Contact) {
    if (!can(`${type}.${item ? "editar" : "crear"}`)) {
      notify("No tenés permiso para esta operación.", true);
      return;
    }
    const clients = type === "clientes",
      key = clients ? "clients" : "suppliers";
    form(
      item
        ? "Editar " + (clients ? "cliente" : "proveedor")
        : "Nuevo " + (clients ? "cliente" : "proveedor"),
      [
        { name: "name", label: "Nombre / razón social" },
        { name: "doc", label: "RUC / documento" },
        { name: "phone", label: "Teléfono", required: false },
        {
          name: "email",
          label: "Correo electrónico",
          type: "email",
          required: false,
        },
        { name: "address", label: "Dirección", required: false },
        ...(clients
          ? [
              {
                name: "credit",
                label: "Límite de crédito (Gs.)",
                type: "number",
                min: 0,
              },
            ]
          : []),
      ],
      item
        ? {
            name: item.name,
            doc: item.doc,
            phone: item.phone,
            email: item.email,
            address: item.address,
            credit: item.credit ?? 0,
          }
        : { credit: 0 },
      (v) => {
        const s = structuredClone(data),
          c = {
            name: String(v.name ?? ""),
            doc: String(v.doc ?? ""),
            phone: String(v.phone ?? ""),
            email: String(v.email ?? ""),
            address: String(v.address ?? ""),
            id: item?.id || uid(),
            credit: Number(v.credit) || 0,
          };
        if (clients)
          s.clients = item
            ? s.clients.map((x) => (x.id === item.id ? c : x))
            : [...s.clients, c];
        else
          s.suppliers = item
            ? s.suppliers.map((x) => (x.id === item.id ? c : x))
            : [...s.suppliers, c];
        commit(s, (clients ? "Cliente" : "Proveedor") + " guardado");
      },
    );
  }
  function viewInvoice(inv: Invoice) {
    setModal({ kind: "invoice", id: inv.id });
  }
  function pay(inv: Invoice) {
    if (!can("ventas.cobrar")) {
      notify("No tenés permiso para registrar cobros.", true);
      return;
    }
    form(
      "Registrar cobro",
      [
        {
          name: "amount",
          label: "Importe a cobrar (Gs.)",
          type: "number",
          min: 1,
          max: inv.total - inv.paid,
        },
        {
          name: "method",
          label: "Forma de pago",
          options: ["Efectivo", "Tarjeta", "Transferencia"],
        },
      ],
      { amount: inv.total - inv.paid, method: "Efectivo" },
      (v) =>
        commit(
          payInvoice(data, inv.id, Number(v.amount), String(v.method)),
          "Cobro registrado",
        ),
      "Saldo pendiente: " + money(inv.total - inv.paid),
    );
  }
  function openSale() {
    setCart([]);
    setSaleDiscount(0);
    setSaleClient("c1");
    go("nueva-venta");
  }
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
          <aside className="sidebar">
            <Brand />
            <div className="nav-caption">ESPACIO DE TRABAJO</div>
            <nav>
              {navigation
                .filter(
                  (n) => allowed.includes(n[0]) && n[0] !== "configuracion",
                )
                .map(([id, label, Icon]) => (
                  <button
                    key={id}
                    aria-label={label}
                    className={cn(
                      (route === id ||
                        (id === "ventas" && route === "nueva-venta") ||
                        (id === "presupuestos" &&
                          route === "nuevo-presupuesto")) &&
                        "selected",
                    )}
                    onClick={() => go(id)}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={21} />
                    <span>{label}</span>
                    {id === "inventario" && (
                      <small>{data.products.length}</small>
                    )}
                  </button>
                ))}
              {administrationNavigation.some(([id]) =>
                allowed.includes(id),
              ) && (
                <div className="administration-nav">
                  <button
                    type="button"
                    aria-label="Administración"
                    aria-expanded={administrationOpen}
                    aria-controls="administration-submenu"
                    title="Administración"
                    className={cn(
                      administrationNavigation.some(([id]) => id === route) &&
                        "selected",
                    )}
                    onClick={() => setAdministrationOpen((open) => !open)}
                  >
                    <I.ShieldCheck size={21} />
                    <span>Administración</span>
                    <I.ChevronDown
                      size={15}
                      className={cn(
                        "administration-chevron",
                        administrationOpen && "open",
                      )}
                    />
                  </button>
                  <div
                    id="administration-submenu"
                    className="administration-submenu"
                    hidden={!administrationOpen}
                  >
                    {administrationNavigation
                      .filter(([id]) => allowed.includes(id))
                      .map(([id, label, Icon]) => (
                        <button
                          type="button"
                          key={id}
                          title={label}
                          aria-label={label}
                          aria-current={route === id ? "page" : undefined}
                          className={cn(route === id && "selected")}
                          onClick={() => go(id)}
                        >
                          <Icon size={18} />
                          <span>{label}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {allowed.includes("configuracion") && (
                <button
                  type="button"
                  aria-label="Configuración"
                  title={collapsed ? "Configuración" : undefined}
                  className={cn(route === "configuracion" && "selected")}
                  onClick={() => go("configuracion")}
                >
                  <I.Settings size={21} />
                  <span>Configuración</span>
                </button>
              )}
            </nav>
            <div className="sidebar-bottom">
              <span className="demo-dot" />
              <div>
                <b>Modo demostración</b>
                <small>Tus cambios se guardan aquí</small>
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <IconButton
                icon={I.Menu}
                label="Mostrar u ocultar menú"
                onClick={() => setCollapsed(!collapsed)}
              />
              <span className="breadcrumb">
                Mi negocio <I.ChevronRight size={13} />
                {administrationNavigation.some(([id]) => id === route) && (
                  <>
                    Administración <I.ChevronRight size={13} />
                  </>
                )}
                <b>{current}</b>
              </span>
              <form
                style={{
                  display:
                    can("inventario.ver") || can("productos.ver")
                      ? undefined
                      : "none",
                }}
                className="global-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setInventoryQuery(globalSearch);
                  go(can("inventario.ver") ? "inventario" : "productos");
                }}
              >
                <I.Search size={17} />
                <input
                  aria-label="Buscar en el inventario"
                  placeholder="Buscar producto o código…"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
                <kbd>↵</kbd>
              </form>
              <label className="warehouse">
                <I.BuildingStore size={18} />
                <select
                  aria-label="Depósito activo"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                >
                  {warehouses.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </label>
              <div
                className="top-pop"
                style={{ display: can("inventario.ver") ? undefined : "none" }}
              >
                <button
                  className="notification icon-btn"
                  aria-label="Notificaciones de stock"
                  onClick={() =>
                    setTopMenu(topMenu === "alerts" ? "" : "alerts")
                  }
                >
                  <I.Bell size={22} />
                  {data.products.some((p) => stock(p, warehouse) <= p.min) && (
                    <span />
                  )}
                </button>
                {topMenu === "alerts" && (
                  <div className="dropdown">
                    <b>Atención al inventario</b>
                    <p>
                      {
                        data.products.filter(
                          (p) => stock(p, warehouse) <= p.min,
                        ).length
                      }{" "}
                      productos necesitan reposición en {warehouse}.
                    </p>
                    <Button
                      variant="text"
                      onClick={() => {
                        setInventoryFilter("Stock bajo");
                        go("inventario");
                      }}
                    >
                      Revisar existencias <I.ArrowRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="top-pop">
                <button
                  className="profile"
                  onClick={() =>
                    setTopMenu(topMenu === "profile" ? "" : "profile")
                  }
                >
                  <span className="avatar">{user!.name[0]}</span>
                  <span>
                    <b>{user!.name.split(" ")[0]}</b>
                    <small>{user!.role}</small>
                  </span>
                  <I.ChevronDown size={14} />
                </button>
                {topMenu === "profile" && (
                  <div className="dropdown">
                    <b>{user!.name}</b>
                    <p>{user.username}</p>
                    <Button
                      variant="secondary"
                      icon={I.Logout}
                      onClick={logout}
                    >
                      Cerrar sesión
                    </Button>
                  </div>
                )}
              </div>
            </header>
            <main className="content">
              {!can(routeAccess(route)) ? (
                <Panel title="Sin accesos habilitados">
                  <p>
                    Tu perfil no tiene acceso a este módulo. Consultá al
                    administrador.
                  </p>
                </Panel>
              ) : route === "inicio" ? (
                <Dashboard />
              ) : route === "inventario" || route === "productos" ? (
                <Inventory
                  title={route === "productos" ? "Productos" : "Inventario"}
                />
              ) : route === "movimientos" ? (
                <Movements />
              ) : route === "ventas" ? (
                <Sales />
              ) : route === "nueva-venta" || route === "nuevo-presupuesto" ? (
                <SaleEditor quoteOnly={route === "nuevo-presupuesto"} />
              ) : route === "compras" ? (
                <Purchases />
              ) : route === "presupuestos" ? (
                <Quotes />
              ) : route === "clientes" || route === "proveedores" ? (
                <Contacts key={route} type={route} />
              ) : route === "reportes" ? (
                <Reports />
              ) : route === "usuarios" ? (
                <Users currentUserId={user.id} />
              ) : route === "personas" ? (
                <People />
              ) : route === "perfiles" ? (
                <Profiles />
              ) : route === "permisos" ? (
                <Permissions />
              ) : (
                <Settings />
              )}
            </main>
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
function SalesChart({ invoices }: { invoices: Invoice[] }) {
  const values = Array.from({ length: 7 }, (_, i) => {
    const d = "2026-10-" + (20 + i);
    return {
      name: 20 + i + " oct.",
      value: invoices
        .filter((x) => x.date === d && x.state !== "Anulada")
        .reduce((a, x) => a + x.total, 0),
    };
  });
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={values}
          margin={{ left: 0, right: 10, top: 15, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e9eef4"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#63748c" }}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1e6 ? v / 1e6 + " M" : v / 1000 + " mil"
            }
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#63748c" }}
            width={48}
          />
          <Tooltip
            formatter={(v) => money(Number(v))}
            cursor={{ fill: "#f0f6fd" }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="value"
            name="Ventas"
            fill="#0c88f7"
            radius={[3, 3, 0, 0]}
            maxBarSize={62}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function Composition({
  products,
  warehouse,
}: {
  products: Product[];
  warehouse: string;
}) {
  const data = categories
    .map((name, i) => ({
      name,
      value: products
        .filter((p) => p.category === name)
        .reduce((a, p) => a + stock(p, warehouse) * p.cost, 0),
      color: palette[i],
    }))
    .filter((x) => x.value > 0);
  return (
    <div className="composition">
      <div className="donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="value"
              innerRadius="63%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((x) => (
                <Cell key={x.name} fill={x.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => money(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <span>
          <b>{products.length}</b>
          <small>productos</small>
        </span>
      </div>
      <div className="legend">
        {data.slice(0, 5).map((x) => (
          <div key={x.name}>
            <span style={{ background: x.color }} />
            <b>{x.name}</b>
            <small>
              {Math.round(
                (x.value / data.reduce((a, x) => a + x.value, 0)) * 100,
              )}
              %
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
function Dashboard() {
  const {
    data,
    warehouse,
    go,
    openSale,
    setInventoryFilter,
    movementForm,
    viewInvoice,
  } = useApp();
  const invoices = data.invoices.filter(
      (x) => x.state !== "Anulada" && x.warehouse === warehouse,
    ),
    low = data.products.filter((p) => stock(p, warehouse) <= p.min),
    debt = invoices.filter((x) => x.total > x.paid),
    total = invoices.reduce((a, x) => a + x.total, 0);
  return (
    <>
      <PageTitle
        title="Resumen del negocio"
        subtitle="Hoy es lunes, 26 de octubre de 2026"
      >
        <Button
          access="ventas.crear"
          icon={I.Plus}
          variant="green"
          onClick={openSale}
        >
          Nueva venta
        </Button>
      </PageTitle>
      <div className="stats-grid">
        <Stat
          label="Ventas del mes"
          value={money(total)}
          note={invoices.length + " ventas registradas"}
          icon={I.ShoppingCart}
          color="green"
          onClick={() => go("ventas")}
        />
        <Stat
          label="Productos"
          value={num(data.products.length)}
          note="Productos en tu catálogo"
          icon={I.Box}
          onClick={() => go("inventario")}
        />
        <Stat
          label="Stock bajo"
          value={low.length}
          note="Productos por reponer"
          icon={I.AlertTriangle}
          color="orange"
          onClick={() => {
            setInventoryFilter("Stock bajo");
            go("inventario");
          }}
        />
        <Stat
          label="Facturas pendientes"
          value={debt.length}
          note={money(debt.reduce((a, x) => a + x.total - x.paid, 0))}
          icon={I.Receipt}
          color="purple"
          onClick={() => go("ventas")}
        />
      </div>
      <div className="dashboard-main">
        <Panel
          title="Productos con stock bajo"
          icon={I.AlertTriangle}
          color="red"
          action={
            <Button
              variant="text"
              onClick={() => {
                setInventoryFilter("Stock bajo");
                go("inventario");
              }}
            >
              Ver inventario <I.ArrowRight size={16} />
            </Button>
          }
        >
          <Table
            headers={[
              "Código / producto",
              "Disponible",
              "Mínimo",
              "Estado",
              "",
            ]}
            empty={!low.length}
          >
            {low.slice(0, 6).map((p) => (
              <tr key={p.id}>
                <td>
                  <ProductName p={p} />
                </td>
                <td className="danger-text">
                  <b>{num(stock(p, warehouse))}</b> <small>{p.unit}</small>
                </td>
                <td>{p.min}</td>
                <td>
                  <Badge>{status(p, warehouse)}</Badge>
                </td>
                <td>
                  <Button
                    access="movimientos.crear"
                    variant="outline small"
                    icon={I.Plus}
                    onClick={() => movementForm(p)}
                  >
                    Reponer
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel
          title="Últimas ventas"
          icon={I.ChartBar}
          color="green"
          action={
            <Button variant="text" onClick={() => go("ventas")}>
              Ver todas <I.ArrowRight size={16} />
            </Button>
          }
        >
          <Table
            headers={["Comprobante", "Cliente", "Total", "Estado"]}
            empty={!invoices.length}
          >
            {invoices.slice(0, 6).map((x) => (
              <tr
                key={x.id}
                onClick={() => viewInvoice(x)}
                className="clickable"
              >
                <td>
                  <button
                    className="table-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewInvoice(x);
                    }}
                  >
                    {x.number.slice(-7)}
                  </button>
                  <small className="block">{date(x.date)}</small>
                </td>
                <td>{data.clients.find((c) => c.id === x.client)?.name}</td>
                <td className="nowrap">
                  <b>{money(x.total)}</b>
                </td>
                <td>
                  <Badge>{x.state}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title="Ventas de los últimos 7 días"
          icon={I.ChartBar}
          action={
            <span className="panel-total">
              <small>Total del período</small>
              <b>{money(total)}</b>
            </span>
          }
        >
          <SalesChart invoices={invoices} />
        </Panel>
        <Panel
          title="Composición del inventario"
          icon={I.ChartBar}
          color="purple"
        >
          <Composition products={data.products} warehouse={warehouse} />
        </Panel>
      </div>
    </>
  );
}
function Inventory({ title }: { title: string }) {
  const {
    data,
    warehouse,
    productForm,
    movementForm,
    inventoryQuery: q,
    setInventoryQuery: setQ,
    inventoryFilter: filter,
    setInventoryFilter: setFilter,
    go,
  } = useApp();
  const [category, setCategory] = useState("Todas"),
    [selected, setSelected] = useState(1),
    [page, setPage] = useState(1);
  const p =
      requireRecord(
        data.products.find((x) => x.id === selected),
        "Producto",
      ) || data.products[0],
    filtered = data.products.filter(
      (p) =>
        (p.name + " " + p.code + " " + p.barcode + " " + p.brand)
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (category === "Todas" || p.category === category) &&
        (filter === "Todos" ||
          (filter === "Stock bajo"
            ? stock(p, warehouse) <= p.min
            : status(p, warehouse) === filter)),
    );
  useEffect(() => setPage(1), [q, filter, category, warehouse]);
  const rows = filtered.slice((page - 1) * 7, page * 7);
  return (
    <>
      <PageTitle title={title} subtitle="Controlá tus productos y existencias.">
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              "inventario.csv",
              [
                "Código",
                "Producto",
                "Categoría",
                "Unidad",
                "Depósito",
                "Stock",
                "Mínimo",
                "Costo",
                "Precio",
              ],
              filtered.map((p) => [
                p.code,
                p.name,
                p.category,
                p.unit,
                warehouse,
                stock(p, warehouse),
                p.min,
                p.cost,
                p.price,
              ]),
            )
          }
        >
          Exportar
        </Button>
        <Button
          access="productos.crear"
          icon={I.Plus}
          onClick={() => productForm()}
        >
          Nuevo producto
        </Button>
      </PageTitle>
      <div className="inventory-layout">
        <div>
          <div className="stats-grid compact">
            <Stat
              label="Productos"
              value={data.products.length}
              note="En el catálogo"
              icon={I.Box}
              color="green"
            />
            <Stat
              label="Stock bajo"
              value={
                data.products.filter(
                  (x) =>
                    stock(x, warehouse) > 0 && stock(x, warehouse) <= x.min,
                ).length
              }
              note="Requieren atención"
              icon={I.AlertTriangle}
              color="orange"
            />
            <Stat
              label="Sin stock"
              value={
                data.products.filter((x) => stock(x, warehouse) === 0).length
              }
              note="En este depósito"
              icon={I.X}
              color="red"
            />
            <Stat
              label="Valor del inventario"
              value={money(
                data.products.reduce(
                  (a, p) => a + stock(p, warehouse) * p.cost,
                  0,
                ),
              )}
              note="Valorizado al costo"
              icon={I.Receipt}
            />
          </div>
          <div className="filter-bar">
            <Search
              value={q}
              onChange={setQ}
              placeholder="Buscar por nombre, SKU o código de barras…"
            />
            <Field label="Categoría">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Todas</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["Todos", "Disponible", "Stock bajo", "Sin stock"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <Panel>
            <Table
              headers={[
                "Código",
                "Producto",
                "Stock",
                "Mínimo",
                "Precio de venta",
                "Estado",
                "",
              ]}
              empty={!rows.length}
            >
              {rows.map((x) => (
                <tr
                  key={x.id}
                  className={cn("clickable", x.id === p.id && "row-selected")}
                  onClick={() => setSelected(x.id)}
                >
                  <td className="muted">{x.code}</td>
                  <td>
                    <button
                      className="product-button"
                      onClick={() => setSelected(x.id)}
                    >
                      <ProductName p={x} />
                    </button>
                  </td>
                  <td>
                    <b>{num(stock(x, warehouse))}</b>
                    <small className="block">{x.unit}</small>
                  </td>
                  <td>{num(x.min)}</td>
                  <td className="nowrap">{money(x.price)}</td>
                  <td>
                    <Badge>{status(x, warehouse)}</Badge>
                  </td>
                  <td>
                    <IconButton
                      access="productos.editar"
                      icon={I.Edit}
                      label={"Editar " + x.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        productForm(x);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </Table>
            <div className="pagination">
              <small>
                Mostrando {filtered.length ? (page - 1) * 7 + 1 : 0}–
                {Math.min(page * 7, filtered.length)} de {filtered.length}{" "}
                productos
              </small>
              <div>
                <IconButton
                  icon={I.ArrowLeft}
                  label="Página anterior"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                />
                <b>{page}</b>
                <IconButton
                  icon={I.ChevronRight}
                  label="Página siguiente"
                  disabled={page * 7 >= filtered.length}
                  onClick={() => setPage(page + 1)}
                />
              </div>
            </div>
          </Panel>
        </div>
        <aside className="product-detail">
          <Button
            access="movimientos.crear"
            variant="secondary"
            icon={I.ArrowsExchange}
            onClick={() => movementForm(p)}
          >
            Registrar movimiento
          </Button>
          <Panel>
            <div className="detail-hero">
              <ProductImage product={p} large />
              <h2>{p.name}</h2>
              <p>Código: {p.code}</p>
              <span>{p.brand}</span>
            </div>
            <div className="stock-pair">
              <div>
                <small>Stock actual</small>
                <strong>{num(stock(p, warehouse))}</strong>
                <span>{p.unit}</span>
              </div>
              <div>
                <small>Stock mínimo</small>
                <strong>{p.min}</strong>
                <span>{p.unit}</span>
              </div>
            </div>
            <Badge>{status(p, warehouse)}</Badge>
            <dl>
              <div>
                <dt>Categoría</dt>
                <dd>{p.category}</dd>
              </div>
              <div>
                <dt>Depósito</dt>
                <dd>{warehouse}</dd>
              </div>
              <div>
                <dt>Precio de venta</dt>
                <dd>{money(p.price)}</dd>
              </div>
            </dl>
            <div className="detail-subtitle">
              <b>Movimientos recientes</b>
              <Button access="movimientos.ver" variant="text" onClick={() => go("movimientos")}>
                Ver todos
              </Button>
            </div>
            {data.movements
              .filter((x) => x.productId === p.id)
              .slice(0, 2)
              .map((m) => (
                <div className="recent-move" key={m.id}>
                  <span
                    className={"soft-icon " + (m.qty > 0 ? "green" : "red")}
                  >
                    {m.qty > 0 ? (
                      <I.ArrowUp size={18} />
                    ) : (
                      <I.ArrowDown size={18} />
                    )}
                  </span>
                  <div>
                    <b>{m.type}</b>
                    <small>{date(m.date)}</small>
                  </div>
                  <strong
                    className={m.qty > 0 ? "success-text" : "danger-text"}
                  >
                    {m.qty > 0 ? "+" : ""}
                    {num(m.qty)}
                  </strong>
                </div>
              ))}
            {!data.movements.some((x) => x.productId === p.id) && (
              <p className="muted">
                Aún no hay movimientos para este producto.
              </p>
            )}
            <Button
              access="productos.editar"
              variant="outline full"
              icon={I.Edit}
              onClick={() => productForm(p)}
            >
              Editar producto
            </Button>
          </Panel>
        </aside>
      </div>
    </>
  );
}
function Movements() {
  const { data, warehouse, movementForm } = useApp();
  const [q, setQ] = useState(""),
    [type, setType] = useState("Todos");
  const rows = data.movements.filter((m) => {
    const p = requireRecord(
      data.products.find((x) => x.id === m.productId),
      "Producto",
    );
    return (
      m.warehouse === warehouse &&
      (type === "Todos" || (type === "Entradas" ? m.qty > 0 : m.qty < 0)) &&
      (p.name + " " + m.reason + " " + p.code)
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  });
  return (
    <>
      <PageTitle
        title="Movimientos de stock"
        subtitle="Cada entrada, salida y transferencia, en un solo historial."
      >
        <Button
          access="movimientos.crear"
          icon={I.ArrowsExchange}
          onClick={() => movementForm()}
        >
          Registrar movimiento
        </Button>
      </PageTitle>
      <MiniStats
        items={[
          ["Movimientos", rows.length, I.ArrowsExchange, "blue"],
          [
            "Entradas",
            rows.filter((x) => x.qty > 0).length,
            I.ArrowUp,
            "green",
          ],
          [
            "Salidas",
            rows.filter((x) => x.qty < 0).length,
            I.ArrowDown,
            "orange",
          ],
        ]}
      />
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar producto o referencia…"
        />
        <Field label="Tipo">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {["Todos", "Entradas", "Salidas"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              "movimientos.csv",
              [
                "Fecha",
                "Producto",
                "Tipo",
                "Cantidad",
                "Depósito",
                "Referencia",
                "Usuario",
              ],
              rows.map((m) => [
                m.date,
                requireRecord(
                  data.products.find((x) => x.id === m.productId),
                  "Producto",
                ).name,
                m.type,
                m.qty,
                m.warehouse,
                m.reason,
                m.user,
              ]),
            )
          }
        >
          Exportar
        </Button>
      </div>
      <Panel>
        <Table
          headers={[
            "Fecha",
            "Producto",
            "Tipo",
            "Cantidad",
            "Depósito",
            "Referencia",
            "Responsable",
          ]}
          empty={!rows.length}
        >
          {rows.map((m) => (
            <tr key={m.id}>
              <td>{date(m.date)}</td>
              <td>
                <ProductName
                  p={requireRecord(
                    data.products.find((x) => x.id === m.productId),
                    "Producto",
                  )}
                />
              </td>
              <td>
                <Badge>{m.type}</Badge>
              </td>
              <td className={m.qty > 0 ? "success-text" : "danger-text"}>
                <b>
                  {m.qty > 0 ? "+" : ""}
                  {num(m.qty)}
                </b>
              </td>
              <td>{m.warehouse}</td>
              <td>{m.reason}</td>
              <td>{m.user}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Sales() {
  const { data, warehouse, openSale, viewInvoice, pay } = useApp();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("Todas");
  const rows = data.invoices.filter(
    (x) =>
      x.warehouse === warehouse &&
      (x.number + " " + data.clients.find((c) => c.id === x.client)?.name)
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (filter === "Todas" ||
        (filter === "Pendientes"
          ? x.total > x.paid && x.state !== "Anulada"
          : x.state === filter)),
  );
  return (
    <>
      <PageTitle
        title="Ventas y facturación"
        subtitle="Tus comprobantes, cobros y cuentas pendientes."
      >
        <Button
          access="ventas.crear"
          icon={I.Plus}
          variant="green"
          onClick={openSale}
        >
          Nueva venta
        </Button>
      </PageTitle>
      <MiniStats
        items={[
          [
            "Ventas registradas",
            data.invoices.filter((x) => x.state !== "Anulada").length,
            I.Receipt,
            "blue",
          ],
          [
            "Total vendido",
            money(
              data.invoices
                .filter((x) => x.state !== "Anulada")
                .reduce((a, x) => a + x.total, 0),
            ),
            I.ChartBar,
            "green",
          ],
          [
            "Saldo por cobrar",
            money(
              data.invoices
                .filter((x) => x.state !== "Anulada")
                .reduce((a, x) => a + x.total - x.paid, 0),
            ),
            I.Clock,
            "orange",
          ],
        ]}
      />
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar comprobante o cliente…"
        />
        <Field label="Estado">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["Todas", "Pendientes", "Pagada", "Parcial", "Anulada"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </Field>
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              "ventas.csv",
              ["Comprobante", "Fecha", "Cliente", "Total", "Cobrado", "Estado"],
              rows.map((x) => [
                x.number,
                x.date,
                data.clients.find((c) => c.id === x.client)?.name,
                x.total,
                x.paid,
                x.state,
              ]),
            )
          }
        >
          Exportar
        </Button>
      </div>
      <Panel>
        <Table
          headers={[
            "Comprobante",
            "Fecha",
            "Cliente",
            "Forma de pago",
            "Total",
            "Saldo",
            "Estado",
            "Acciones",
          ]}
          empty={!rows.length}
        >
          {rows.map((x) => (
            <tr key={x.id}>
              <td>
                <button className="table-link" onClick={() => viewInvoice(x)}>
                  {x.number}
                </button>
              </td>
              <td>{date(x.date)}</td>
              <td>{data.clients.find((c) => c.id === x.client)?.name}</td>
              <td>{x.payment}</td>
              <td className="nowrap">
                <b>{money(x.total)}</b>
              </td>
              <td className="nowrap">
                {x.state === "Anulada" ? "—" : money(x.total - x.paid)}
              </td>
              <td>
                <Badge>{x.state}</Badge>
              </td>
              <td>
                <div className="row-actions">
                  <IconButton
                    access="ventas.ver"
                    icon={I.Eye}
                    label={"Ver comprobante " + x.number}
                    onClick={() => viewInvoice(x)}
                  />
                  {x.total > x.paid && x.state !== "Anulada" && (
                    <Button
                      access="ventas.cobrar"
                      variant="outline small"
                      onClick={() => pay(x)}
                    >
                      Cobrar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function SaleEditor({ quoteOnly }: { quoteOnly: boolean }) {
  const { can } = useApp();
  const {
    data,
    user,
    warehouse,
    cart,
    setCart,
    saleClient,
    setSaleClient,
    saleDiscount,
    go,
    commit,
    notify,
    viewInvoice,
  } = useApp();
  const [q, setQ] = useState(""),
    [payment, setPayment] = useState("Efectivo"),
    [discount, setDiscount] = useState(saleDiscount || 0),
    [received, setReceived] = useState(""),
    [error, setError] = useState("");
  const items = cart.map((x) => ({
      ...x,
      p: requireRecord(
        data.products.find((p) => p.id === x.productId),
        "Producto",
      ),
    })),
    subtotal = items.reduce((a, x) => a + x.qty * x.p.price, 0),
    total = Math.max(0, Math.round(subtotal - Number(discount))),
    matches = data.products.filter((p) =>
      (p.name + " " + p.code + " " + p.barcode)
        .toLowerCase()
        .includes(q.toLowerCase()),
    );
  function add(p: Product) {
    setError("");
    if (stock(p, warehouse) <= 0) {
      setError("Este producto no tiene stock en " + warehouse + ".");
      return;
    }
    const existing = cart.find((x) => x.productId === p.id),
      qty = (existing?.qty || 0) + 1;
    if (qty > stock(p, warehouse)) {
      setError("No hay más stock disponible para " + p.name + ".");
      return;
    }
    setCart(
      existing
        ? cart.map((x) => (x.productId === p.id ? { ...x, qty } : x))
        : [...cart, { productId: p.id, qty: 1 }],
    );
    setQ("");
  }
  function saveQuote() {
    if (!can("presupuestos.crear")) return;
    if (!cart.length) {
      setError("Agregá productos antes de guardar.");
      return;
    }
    const s = structuredClone(data);
    s.quotes.unshift({
      id: uid(),
      number: "PRE-" + String(s.quotes.length + 1).padStart(5, "0"),
      date: TODAY,
      client: saleClient,
      warehouse,
      items: cart.map((x) => ({ ...x })),
      discount: Number(discount) || 0,
      total,
      state: "Borrador",
    });
    commit(s, "Presupuesto guardado");
    setCart([]);
    go("presupuestos");
  }
  function finish() {
    if (!can("ventas.crear") || quoteOnly) return;
    setError("");
    try {
      const result = checkout(
        data,
        {
          items: cart,
          client: saleClient,
          warehouse,
          discount,
          received,
          payment,
        },
        user!.name,
      );
      commit(result.state, "Venta registrada. Stock actualizado.");
      setCart([]);
      viewInvoice(result.invoice);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    }
  }
  return (
    <>
      <PageTitle
        title={quoteOnly ? "Nuevo presupuesto" : "Nueva venta"}
        subtitle="Registrá la venta y actualizá el stock en un solo paso."
      >
        <Button
          variant="secondary"
          icon={I.ArrowLeft}
          onClick={() => go(quoteOnly ? "presupuestos" : "ventas")}
        >
          {quoteOnly ? "Volver a presupuestos" : "Volver a ventas"}
        </Button>
      </PageTitle>
      <div className="pos-layout">
        <Panel className="pos-products">
          <div className="pos-fields">
            <Field label="Cliente">
              <select
                value={saleClient}
                onChange={(e) => setSaleClient(e.target.value)}
              >
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Condición de venta">
              <select
                value={payment === "Crédito" ? "Crédito" : "Contado"}
                onChange={(e) =>
                  setPayment(
                    e.target.value === "Crédito" ? "Crédito" : "Efectivo",
                  )
                }
              >
                <option>Contado</option>
                <option>Crédito</option>
              </select>
            </Field>
            <Field label="Depósito">
              <input readOnly value={warehouse} />
            </Field>
          </div>
          <form
            className="pos-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (matches[0]) add(matches[0]);
            }}
          >
            <I.Barcode size={26} />
            <input
              aria-label="Buscar producto para la venta"
              placeholder="Buscar producto o escanear código…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button
              type="submit"
              icon={I.Search}
              aria-label="Agregar primer resultado"
            />
          </form>
          {q ? (
            <div className="product-results">
              {matches.slice(0, 6).map((p) => (
                <button key={p.id} onClick={() => add(p)}>
                  <ProductName p={p} />
                  <span>
                    {money(p.price)}
                    <small>
                      {num(stock(p, warehouse))} {p.unit} disponibles
                    </small>
                  </span>
                  <I.Plus size={18} />
                </button>
              ))}
              {!matches.length && <Empty />}
            </div>
          ) : (
            <div className="recommended">
              <b>Productos frecuentes</b>
              <div>
                {[data.products[0], data.products[2], data.products[1]].map(
                  (p) => (
                    <button
                      key={p.id}
                      onClick={() => add(p)}
                      aria-label={"Agregar " + p.name}
                    >
                      <ProductImage product={p} />
                      <span>
                        {p.name}
                        <small>{money(p.price)}</small>
                      </span>
                      <I.Plus size={20} />
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
          <Table
            headers={["", "Producto", "Cantidad", "Precio", "Importe", "Stock"]}
            empty={!cart.length}
          >
            {items.map(({ p, qty, productId }) => (
              <tr key={productId}>
                <td>
                  <IconButton
                    icon={I.X}
                    label={"Quitar " + p.name}
                    onClick={() =>
                      setCart(cart.filter((x) => x.productId !== productId))
                    }
                  />
                </td>
                <td>
                  <ProductName p={p} />
                </td>
                <td>
                  <div className="quantity">
                    <button
                      aria-label={"Restar " + p.name}
                      onClick={() =>
                        setCart(
                          cart.map((x) =>
                            x.productId === productId
                              ? { ...x, qty: Math.max(1, x.qty - 1) }
                              : x,
                          ),
                        )
                      }
                    >
                      <I.Minus size={13} />
                    </button>
                    <input
                      aria-label={"Cantidad " + p.name}
                      type="number"
                      min={["metro", "kilo"].includes(p.unit) ? 0.01 : 1}
                      step={["metro", "kilo"].includes(p.unit) ? 0.01 : 1}
                      value={qty}
                      onChange={(e) =>
                        setCart(
                          cart.map((x) =>
                            x.productId === productId
                              ? { ...x, qty: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                    <button
                      aria-label={"Sumar " + p.name}
                      onClick={() =>
                        setCart(
                          cart.map((x) =>
                            x.productId === productId
                              ? { ...x, qty: x.qty + 1 }
                              : x,
                          ),
                        )
                      }
                    >
                      <I.Plus size={13} />
                    </button>
                  </div>
                  <small className="block">{p.unit}</small>
                </td>
                <td className="nowrap">{money(p.price)}</td>
                <td className="nowrap">
                  <b>{money(qty * p.price)}</b>
                </td>
                <td>
                  <span className="stock-note">
                    {num(stock(p, warehouse))} disp.
                  </span>
                </td>
              </tr>
            ))}
          </Table>
          <div className="pos-bottom">
            <I.InfoCircle size={17} />
            <span>
              Los precios son de ejemplo. El stock se descuenta al confirmar la
              venta.
            </span>
          </div>
        </Panel>
        <Panel className="checkout">
          <h2>
            <I.ShoppingCart size={24} /> Resumen de venta
          </h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            <div>
              <dt>
                <label htmlFor="discount">Descuento (Gs.)</label>
              </dt>
              <dd>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </dd>
            </div>
          </dl>
          <div className="total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <h3>Forma de pago</h3>
          {payment === "Crédito" ? (
            <div className="credit-note">
              <I.Clock size={22} />
              <span>
                Venta a crédito
                <small>Se registrará en la cuenta del cliente.</small>
              </span>
            </div>
          ) : (
            <div className="payment-options">
              {(
                [
                  ["Efectivo", I.Cash],
                  ["Tarjeta", I.CreditCard],
                  ["Transferencia", I.BuildingBank],
                ] as [string, Icon][]
              ).map(([name, Icon]) => (
                <button
                  key={name}
                  className={payment === name ? "active" : ""}
                  onClick={() => setPayment(name)}
                >
                  <Icon size={21} />
                  {name}
                </button>
              ))}
            </div>
          )}
          {payment === "Efectivo" && (
            <>
              <Field
                label="Monto recibido (Gs.)"
                type="number"
                min="0"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder="0"
              />
              <div className="change">
                <span>Vuelto</span>
                <strong>{money(Math.max(0, Number(received) - total))}</strong>
              </div>
            </>
          )}
          {payment === "Crédito" && (
            <p className="muted">
              Límite del cliente:{" "}
              {money(data.clients.find((c) => c.id === saleClient)?.credit)}
            </p>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {!quoteOnly && (
            <Button
              access="ventas.crear"
              variant="green full"
              icon={I.Receipt}
              disabled={!cart.length}
              onClick={finish}
            >
              {payment === "Crédito"
                ? "Emitir a crédito"
                : "Cobrar y emitir comprobante"}
            </Button>
          )}
          <Button
            access="presupuestos.crear"
            variant="secondary full"
            icon={I.FileText}
            disabled={!cart.length}
            onClick={saveQuote}
          >
            Guardar presupuesto
          </Button>
        </Panel>
      </div>
    </>
  );
}
function InvoiceModal({ id }: { id: string }) {
  const { can } = useApp();
  const { data, user, setModal, pay, confirm, act } = useApp();
  const inv = requireRecord(
      data.invoices.find((x) => x.id === id),
      "Factura",
    ),
    client = requireRecord(
      data.clients.find((c) => c.id === inv.client),
      "Cliente",
    );
  return (
    <Modal
      title="Comprobante de venta"
      onClose={() => setModal(null)}
      wide
      className="receipt-modal"
    >
      <div className="receipt print-area">
        <div className="receipt-head">
          <div>
            <Brand dark />
            <h3>{data.settings.company}</h3>
            <p>
              {data.settings.doc}
              <br />
              {data.settings.address}
              <br />
              {data.settings.phone}
            </p>
          </div>
          <div>
            <span className="demo-receipt">COMPROBANTE DEMOSTRATIVO</span>
            <h2>{inv.number}</h2>
            <p>
              {date(inv.date)} · {inv.warehouse}
            </p>
            <Badge>{inv.state}</Badge>
          </div>
        </div>
        <div className="receipt-client">
          <b>Cliente: {client.name}</b>
          <span>RUC / documento: {client.doc}</span>
          <span>Forma de pago: {inv.payment}</span>
        </div>
        <Table headers={["Descripción", "Cantidad", "Precio", "Importe"]}>
          {inv.items.map((x) => (
            <tr key={x.productId}>
              <td>{x.name}</td>
              <td>
                {num(x.qty)} {x.unit}
              </td>
              <td>{money(x.price)}</td>
              <td>{money(x.qty * x.price)}</td>
            </tr>
          ))}
        </Table>
        <div className="receipt-totals">
          <span>
            Descuento <b>{money(inv.discount)}</b>
          </span>
          <strong>
            Total <b>{money(inv.total)}</b>
          </strong>
          <span>
            Cobrado <b>{money(inv.paid)}</b>
          </span>
          <span>
            Saldo pendiente{" "}
            <b>{inv.state === "Anulada" ? "—" : money(inv.total - inv.paid)}</b>
          </span>
        </div>
        <p className="receipt-note">Documento de muestra sin validez fiscal.</p>
      </div>
      <div className="modal-actions wrap">
        <Button
          variant="secondary"
          icon={I.Printer}
          onClick={() => window.print()}
        >
          Imprimir / PDF
        </Button>
        {inv.state !== "Anulada" && inv.total > inv.paid && (
          <Button access="ventas.cobrar" icon={I.Cash} onClick={() => pay(inv)}>
            Registrar cobro
          </Button>
        )}
        {inv.state !== "Anulada" && can("ventas.anular") && (
          <Button
            access="ventas.anular"
            variant="danger-outline"
            icon={I.ArrowBackUp}
            onClick={() =>
              confirm(
                "Anular venta",
                "Se devolverán los productos al stock y se registrará el reintegro de lo cobrado en la caja de demostración.",
                () => {
                  if (
                    !act(
                      (s) => voidInvoice(s, id, user!.name),
                      "Venta anulada y stock devuelto",
                    )
                  )
                    throw Error(
                      "No se pudo anular. Revisá el estado de la caja.",
                    );
                },
              )
            }
          >
            Anular venta
          </Button>
        )}
      </div>
    </Modal>
  );
}
function Purchases() {
  const { data, warehouse, setModal, act, user } = useApp();
  const [q, setQ] = useState("");
  const rows = data.purchases.filter(
    (x) =>
      x.warehouse === warehouse &&
      (x.number + " " + data.suppliers.find((s) => s.id === x.supplier)?.name)
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Compras"
        subtitle="Planificá la reposición y recibí mercadería en tu depósito."
      >
        <Button
          access="compras.crear"
          icon={I.Plus}
          onClick={() => setModal({ kind: "purchase" })}
        >
          Nueva orden de compra
        </Button>
      </PageTitle>
      <MiniStats
        items={[
          [
            "Órdenes pendientes",
            rows.filter((x) => x.state === "Pendiente").length,
            I.Clock,
            "orange",
          ],
          [
            "Compras recibidas",
            rows.filter((x) => x.state === "Recibida").length,
            I.Truck,
            "green",
          ],
          [
            "Total en órdenes",
            money(rows.reduce((a, x) => a + x.total, 0)),
            I.ShoppingCart,
            "blue",
          ],
        ]}
      />
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar orden o proveedor…"
        />
      </div>
      <Panel>
        <Table
          headers={[
            "Orden",
            "Fecha",
            "Proveedor",
            "Depósito",
            "Total",
            "Estado",
            "Acciones",
          ]}
          empty={!rows.length}
        >
          {rows.map((x) => (
            <tr key={x.id}>
              <td>
                <button
                  className="table-link"
                  onClick={() =>
                    setModal({ kind: "purchase-detail", id: x.id })
                  }
                >
                  {x.number}
                </button>
              </td>
              <td>{date(x.date)}</td>
              <td>{data.suppliers.find((s) => s.id === x.supplier)?.name}</td>
              <td>{x.warehouse}</td>
              <td>
                <b>{money(x.total)}</b>
              </td>
              <td>
                <Badge>{x.state}</Badge>
              </td>
              <td>
                {x.state === "Pendiente" ? (
                  <Button
                    access="compras.recibir"
                    variant="outline small"
                    icon={I.Truck}
                    onClick={() =>
                      act(
                        (s) => receivePurchase(s, x.id, user!.name),
                        "Compra recibida. Stock actualizado.",
                      )
                    }
                  >
                    Recibir mercadería
                  </Button>
                ) : (
                  <Button
                    variant="text"
                    onClick={() =>
                      setModal({ kind: "purchase-detail", id: x.id })
                    }
                  >
                    Ver detalle
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <div className="info-strip">
        <I.InfoCircle size={19} /> El stock se actualiza al recibir la
        mercadería, no al crear la orden de compra.
      </div>
    </>
  );
}
function PurchaseModal() {
  const { data, warehouse, commit, setModal } = useApp();
  const [supplier, setSupplier] = useState(data.suppliers[0].id),
    [depot, setDepot] = useState(warehouse),
    [productId, setProductId] = useState(data.products[0].id),
    [qty, setQty] = useState(1),
    [items, setItems] = useState<PurchaseItem[]>([]),
    [error, setError] = useState("");
  const total = items.reduce((a, x) => a + x.qty * x.cost, 0);
  function add() {
    try {
      const p = requireRecord(
        data.products.find((x) => x.id === Number(productId)),
        "Producto",
      );
      validQty(p, Number(qty));
      if (items.some((x) => x.productId === p.id))
        throw Error(
          "El producto ya está en la orden. Quitalo para modificar la cantidad.",
        );
      setItems([
        ...items,
        { productId: p.id, name: p.name, qty: Number(qty), cost: p.cost },
      ]);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    }
  }
  return (
    <Modal title="Nueva orden de compra" onClose={() => setModal(null)} wide>
      <div className="form-grid">
        <Field label="Proveedor">
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            {data.suppliers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Depósito de recepción">
          <select value={depot} onChange={(e) => setDepot(e.target.value)}>
            {warehouses.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="purchase-add">
        <Field label="Producto">
          <select
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
          >
            {data.products.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Cantidad"
          type="number"
          min="0.01"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <Button icon={I.Plus} onClick={add}>
          Agregar
        </Button>
      </div>
      <Table
        headers={["Producto", "Cantidad", "Costo", "Importe", ""]}
        empty={!items.length}
      >
        {items.map((x) => (
          <tr key={x.productId}>
            <td>{x.name}</td>
            <td>{num(x.qty)}</td>
            <td>{money(x.cost)}</td>
            <td>{money(x.qty * x.cost)}</td>
            <td>
              <IconButton
                icon={I.X}
                label={"Quitar " + x.name}
                onClick={() =>
                  setItems(items.filter((i) => i.productId !== x.productId))
                }
              />
            </td>
          </tr>
        ))}
      </Table>
      <div className="total">
        <span>Total de la orden</span>
        <strong>{money(total)}</strong>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <Button variant="secondary" onClick={() => setModal(null)}>
          Cancelar
        </Button>
        <Button
          access="compras.crear"
          disabled={!items.length}
          onClick={() => {
            const s = structuredClone(data);
            s.purchases.unshift({
              id: uid(),
              number:
                "OC-" + String(129 + s.purchases.length - 2).padStart(5, "0"),
              date: TODAY,
              supplier,
              warehouse: depot,
              items,
              total,
              state: "Pendiente",
            });
            commit(s, "Orden de compra creada");
            setModal(null);
          }}
        >
          Crear orden
        </Button>
      </div>
    </Modal>
  );
}
function PurchaseDetail({ id }: { id: string }) {
  const { data, setModal, act, user } = useApp();
  const p = requireRecord(
    data.purchases.find((x) => x.id === id),
    "Compra",
  );
  return (
    <Modal title={"Orden " + p.number} onClose={() => setModal(null)} wide>
      <p>
        {data.suppliers.find((x) => x.id === p.supplier)?.name} · {p.warehouse}{" "}
        · {date(p.date)}
      </p>
      <Badge>{p.state}</Badge>
      <Table headers={["Producto", "Cantidad", "Costo unitario", "Importe"]}>
        {p.items.map((x) => (
          <tr key={x.productId}>
            <td>{x.name}</td>
            <td>{num(x.qty)}</td>
            <td>{money(x.cost)}</td>
            <td>{money(x.qty * x.cost)}</td>
          </tr>
        ))}
      </Table>
      <div className="total">
        <span>Total</span>
        <strong>{money(p.total)}</strong>
      </div>
      <div className="modal-actions">
        {p.state === "Pendiente" && (
          <Button
            access="compras.recibir"
            icon={I.Truck}
            onClick={() => {
              if (
                act(
                  (s) => receivePurchase(s, p.id, user!.name),
                  "Compra recibida. Stock actualizado.",
                )
              )
                setModal(null);
            }}
          >
            Recibir mercadería
          </Button>
        )}
      </div>
    </Modal>
  );
}
function Quotes() {
  const {
    data,
    setCart,
    setSaleClient,
    setSaleDiscount,
    setWarehouse,
    go,
    openSale,
    confirm,
    commit,
  } = useApp();
  return (
    <>
      <PageTitle
        title="Presupuestos"
        subtitle="Prepará una propuesta y convertíla en venta cuando tu cliente confirme."
      >
        <Button
          access="presupuestos.crear"
          icon={I.Plus}
          onClick={() => {
            setCart([]);
            setSaleClient("c1");
            setSaleDiscount(0);
            go("nuevo-presupuesto");
          }}
        >
          Nuevo presupuesto
        </Button>
      </PageTitle>
      <Panel>
        <Table
          headers={[
            "Número",
            "Fecha",
            "Cliente",
            "Productos",
            "Total",
            "Estado",
            "Acciones",
          ]}
          empty={!data.quotes.length}
        >
          {data.quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <b>{q.number}</b>
              </td>
              <td>{date(q.date)}</td>
              <td>{data.clients.find((c) => c.id === q.client)?.name}</td>
              <td>{q.items.length}</td>
              <td>{money(q.total)}</td>
              <td>
                <Badge>{q.state}</Badge>
              </td>
              <td>
                <div className="row-actions">
                  <Button
                    access={["presupuestos.convertir", "ventas.crear"]}
                    variant="outline small"
                    onClick={() => {
                      setCart(q.items.map((x) => ({ ...x })));
                      setSaleClient(q.client);
                      setSaleDiscount(q.discount);
                      setWarehouse(q.warehouse);
                      go("nueva-venta");
                    }}
                  >
                    Convertir en venta
                  </Button>
                  <IconButton
                    access="presupuestos.eliminar"
                    icon={I.Trash}
                    label={"Eliminar " + q.number}
                    onClick={() =>
                      confirm(
                        "Eliminar presupuesto",
                        "Se quitará este presupuesto de la maqueta.",
                        () => {
                          const s = structuredClone(data);
                          s.quotes = s.quotes.filter((x) => x.id !== q.id);
                          commit(s, "Presupuesto eliminado");
                        },
                      )
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <div className="info-strip">
        <I.InfoCircle size={19} /> Un presupuesto no reserva ni descuenta stock.
        Las cantidades se validan al confirmar la venta.
      </div>
    </>
  );
}
function Contacts({ type }: { type: string }) {
  const { data, contactForm, setModal } = useApp();
  const [q, setQ] = useState(""),
    clients = type === "clientes",
    rows = data[clients ? "clients" : "suppliers"].filter((c) =>
      (c.name + " " + c.doc + " " + c.phone)
        .toLowerCase()
        .includes(q.toLowerCase()),
    );
  const debt = (id: string) =>
    data.invoices
      .filter((x) => x.client === id && x.state !== "Anulada")
      .reduce((a, x) => a + x.total - x.paid, 0);
  return (
    <>
      <PageTitle
        title={clients ? "Clientes" : "Proveedores"}
        subtitle={
          clients
            ? "Tus contactos, límites de crédito y cuentas corrientes."
            : "Toda la información de quienes abastecen tu ferretería."
        }
      >
        <Button
          access={`${type}.crear`}
          icon={I.Plus}
          onClick={() => contactForm(type)}
        >
          Nuevo {clients ? "cliente" : "proveedor"}
        </Button>
      </PageTitle>
      <div className="filter-bar">
        <Search
          value={q}
          onChange={setQ}
          placeholder="Buscar por nombre, documento o teléfono…"
        />
        <Button
          variant="secondary"
          icon={I.Download}
          onClick={() =>
            csv(
              type + ".csv",
              ["Nombre", "Documento", "Teléfono", "Correo", "Dirección"],
              rows.map((x) => [x.name, x.doc, x.phone, x.email, x.address]),
            )
          }
        >
          Exportar
        </Button>
      </div>
      <Panel>
        <Table
          headers={[
            "Nombre / razón social",
            "Documento",
            "Contacto",
            clients ? "Límite de crédito" : "Dirección",
            ...(clients ? ["Saldo pendiente"] : []),
            "Acciones",
          ]}
          empty={!rows.length}
        >
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="contact-name">
                  <span className="contact-avatar">{c.name[0]}</span>
                  <b>{c.name}</b>
                </div>
              </td>
              <td>{c.doc}</td>
              <td>
                {c.phone || "—"}
                <small className="block">{c.email}</small>
              </td>
              <td>{clients ? money(c.credit) : c.address}</td>
              {clients && (
                <td className={debt(c.id) > 0 ? "danger-text" : ""}>
                  {money(debt(c.id))}
                </td>
              )}
              <td>
                <div className="row-actions">
                  {clients && (
                    <Button
                      access="clientes.cuenta_corriente"
                      variant="text"
                      onClick={() => setModal({ kind: "statement", id: c.id })}
                    >
                      Cuenta corriente
                    </Button>
                  )}
                  {c.id !== "c1" && (
                    <IconButton
                      access={`${type}.editar`}
                      icon={I.Edit}
                      label={"Editar " + c.name}
                      onClick={() => contactForm(type, c)}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Statement({ id }: { id: string }) {
  const { data, setModal, pay } = useApp();
  const c = requireRecord(
      data.clients.find((x) => x.id === id),
      "Cliente",
    ),
    rows = data.invoices.filter(
      (x) => x.client === id && x.state !== "Anulada",
    );
  return (
    <Modal
      title={"Cuenta corriente · " + c.name}
      onClose={() => setModal(null)}
      wide
    >
      <MiniStats
        items={[
          ["Límite de crédito", money(c.credit), I.ShieldCheck, "blue"],
          [
            "Saldo pendiente",
            money(rows.reduce((a, x) => a + x.total - x.paid, 0)),
            I.Clock,
            "orange",
          ],
        ]}
      />
      <Table
        headers={["Comprobante", "Fecha", "Total", "Cobrado", "Saldo", ""]}
        empty={!rows.length}
      >
        {rows.map((x) => (
          <tr key={x.id}>
            <td>{x.number}</td>
            <td>{date(x.date)}</td>
            <td>{money(x.total)}</td>
            <td>{money(x.paid)}</td>
            <td>{money(x.total - x.paid)}</td>
            <td>
              {x.total > x.paid && (
                <Button
                  access="ventas.cobrar"
                  variant="outline small"
                  onClick={() => pay(x)}
                >
                  Cobrar
                </Button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Modal>
  );
}
function Cash() {
  const { data, commit, form, confirm } = useApp(),
    cash = data.cash,
    expected = cashExpected(cash);
  function open() {
    form(
      "Abrir caja",
      [
        {
          name: "amount",
          label: "Fondo inicial en efectivo (Gs.)",
          type: "number",
          min: 0,
        },
      ],
      { amount: 0 },
      (v) => {
        const s = structuredClone(data);
        s.cash = {
          ...s.cash,
          open: true,
          opening: Number(v.amount),
          entries: [],
          openedAt: TODAY,
        };
        commit(s, "Caja abierta");
      },
    );
  }
  function entry() {
    form(
      "Registrar movimiento de caja",
      [
        { name: "type", label: "Tipo", options: ["Ingreso", "Egreso"] },
        { name: "amount", label: "Importe (Gs.)", type: "number", min: 1 },
        {
          name: "method",
          label: "Forma de pago",
          options: ["Efectivo", "Transferencia", "Tarjeta"],
        },
        { name: "reason", label: "Concepto" },
      ],
      { type: "Egreso", method: "Efectivo", amount: "", reason: "" },
      (v) => {
        if (
          v.type === "Egreso" &&
          v.method === "Efectivo" &&
          Number(v.amount) > expected
        )
          throw Error("El egreso supera el efectivo disponible.");
        const s = structuredClone(data);
        s.cash.entries.unshift({
          type: String(v.type ?? ""),
          reason: String(v.reason ?? ""),
          method: String(v.method ?? ""),
          amount: Number(v.amount),
          id: uid(),
          date: TODAY,
        });
        commit(s, "Movimiento de caja registrado");
      },
    );
  }
  function close() {
    form(
      "Cerrar caja",
      [
        {
          name: "counted",
          label: "Efectivo contado (Gs.)",
          type: "number",
          min: 0,
        },
      ],
      { counted: expected },
      (v) => {
        const s = structuredClone(data);
        s.cash.history.unshift({
          id: uid(),
          date: TODAY,
          opening: cash.opening,
          expected,
          counted: Number(v.counted),
          difference: Number(v.counted) - expected,
        });
        s.cash.open = false;
        commit(s, "Caja cerrada. Arqueo guardado.");
      },
      "Efectivo esperado: " +
        money(expected) +
        ". Se guardará cualquier diferencia de arqueo.",
      "Confirmar cierre",
    );
  }
  return (
    <>
      <PageTitle
        title="Caja"
        subtitle="Seguí tus cobros, gastos y el efectivo disponible."
      >
        {cash.open ? (
          <>
            <Button variant="secondary" icon={I.Plus} onClick={entry}>
              Movimiento de caja
            </Button>
            <Button icon={I.Lock} onClick={close}>
              Cerrar caja
            </Button>
          </>
        ) : (
          <Button icon={I.Plus} variant="green" onClick={open}>
            Abrir caja
          </Button>
        )}
      </PageTitle>
      <div className="cash-status">
        <Badge>{cash.open ? "Activa" : "Inactiva"}</Badge>
        <span>
          {cash.open
            ? "Caja abierta · " + date(cash.openedAt)
            : "Caja cerrada · Abrila para registrar cobros."}
        </span>
      </div>
      <MiniStats
        items={[
          ["Fondo inicial", money(cash.opening), I.Wallet, "blue"],
          [
            "Ingresos",
            money(
              cash.entries
                .filter((e) => e.type === "Ingreso")
                .reduce((a, x) => a + x.amount, 0),
            ),
            I.ArrowUp,
            "green",
          ],
          [
            "Egresos",
            money(
              cash.entries
                .filter((e) => e.type === "Egreso")
                .reduce((a, x) => a + x.amount, 0),
            ),
            I.ArrowDown,
            "red",
          ],
          ["Efectivo esperado", money(expected), I.Cash, "purple"],
        ]}
      />
      <Panel
        title="Movimientos del turno"
        action={
          <Button
            variant="text"
            icon={I.Download}
            onClick={() =>
              csv(
                "caja.csv",
                ["Fecha", "Tipo", "Concepto", "Medio", "Importe"],
                cash.entries.map((x) => [
                  x.date,
                  x.type,
                  x.reason,
                  x.method,
                  x.amount,
                ]),
              )
            }
          >
            Exportar
          </Button>
        }
      >
        <Table
          headers={["Fecha", "Concepto", "Tipo", "Medio de pago", "Importe"]}
          empty={!cash.entries.length}
        >
          {cash.entries.map((x) => (
            <tr key={x.id}>
              <td>{date(x.date)}</td>
              <td>{x.reason}</td>
              <td>
                <Badge>{x.type}</Badge>
              </td>
              <td>{x.method}</td>
              <td
                className={
                  x.type === "Ingreso" ? "success-text" : "danger-text"
                }
              >
                <b>
                  {x.type === "Ingreso" ? "+" : "−"} {money(x.amount)}
                </b>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      {cash.history.length > 0 && (
        <Panel title="Historial de cierres" className="mt">
          <Table
            headers={[
              "Fecha",
              "Fondo inicial",
              "Esperado",
              "Contado",
              "Diferencia",
            ]}
          >
            {cash.history.map((x) => (
              <tr key={x.id}>
                <td>{date(x.date)}</td>
                <td>{money(x.opening)}</td>
                <td>{money(x.expected)}</td>
                <td>{money(x.counted)}</td>
                <td>{money(x.difference)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </>
  );
}
function Reports() {
  const { data, warehouse } = useApp();
  const [from, setFrom] = useState("2026-10-01"),
    [to, setTo] = useState(TODAY),
    [tab, setTab] = useState("Ventas");
  const invoices = data.invoices.filter(
      (x) =>
        x.state !== "Anulada" &&
        x.date >= from &&
        x.date <= to &&
        x.warehouse === warehouse,
    ),
    total = invoices.reduce((a, x) => a + x.total, 0),
    cost = invoices.reduce(
      (a, x) => a + x.items.reduce((t, i) => t + i.cost * i.qty, 0),
      0,
    );
  const top = data.products
    .map((p) => {
      const items = invoices
        .flatMap((x) => x.items)
        .filter((i) => i.productId === p.id);
      return {
        ...p,
        qty: items.reduce((a, i) => a + i.qty, 0),
        total: items.reduce((a, i) => a + i.qty * i.price, 0),
      };
    })
    .filter((p) => p.qty > 0)
    .sort((a, b) => b.total - a.total);
  return (
    <>
      <PageTitle
        title="Reportes"
        subtitle="Información clara para tomar mejores decisiones."
      >
        <Button
          access="reportes.exportar"
          variant="secondary"
          icon={I.Printer}
          onClick={() => window.print()}
        >
          Imprimir
        </Button>
        <Button
          access="reportes.exportar"
          icon={I.Download}
          onClick={() => {
            if (tab === "Inventario")
              csv(
                "reporte-inventario.csv",
                ["Código", "Producto", "Stock", "Costo", "Valorización"],
                data.products.map((p) => [
                  p.code,
                  p.name,
                  stock(p, warehouse),
                  p.cost,
                  stock(p, warehouse) * p.cost,
                ]),
              );
            else
              csv(
                "reporte-ventas.csv",
                ["Fecha", "Comprobante", "Total", "Cobrado"],
                invoices.map((x) => [x.date, x.number, x.total, x.paid]),
              );
          }}
        >
          Exportar CSV
        </Button>
      </PageTitle>
      <div className="report-filters">
        <Field
          label="Desde"
          type="date"
          value={from}
          max={to}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Field
          label="Hasta"
          type="date"
          value={to}
          min={from}
          max={TODAY}
          onChange={(e) => setTo(e.target.value)}
        />
        <div>
          <I.Calendar size={19} />
          <span>
            {warehouse}
            <small>
              Período: {date(from || TODAY)} al {date(to || TODAY)}
            </small>
          </span>
        </div>
      </div>
      <div className="tabs">
        {["Ventas", "Inventario", "Cuentas por cobrar"].map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === "Ventas" ? (
        <>
          <MiniStats
            items={[
              ["Ventas del período", money(total), I.Receipt, "blue"],
              [
                "Margen bruto estimado",
                money(total - cost),
                I.ChartBar,
                "green",
              ],
              [
                "Ticket promedio",
                money(invoices.length ? total / invoices.length : 0),
                I.ShoppingCart,
                "purple",
              ],
              ["Operaciones", invoices.length, I.FileText, "orange"],
            ]}
          />
          <div className="dashboard-bottom">
            <Panel title="Ventas por día · última semana" icon={I.ChartBar}>
              <SalesChart invoices={invoices} />
            </Panel>
            <Panel title="Productos más vendidos" icon={I.Package}>
              <Table
                headers={["Producto", "Cantidad", "Venta bruta"]}
                empty={!top.length}
              >
                {top.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      {num(p.qty)} {p.unit}
                    </td>
                    <td>
                      <b>{money(p.total)}</b>
                    </td>
                  </tr>
                ))}
              </Table>
            </Panel>
          </div>
          <p className="muted">
            Margen estimado = ventas menos costo registrado de los productos. No
            incluye gastos operativos.
          </p>
        </>
      ) : tab === "Inventario" ? (
        <Panel title="Valorización actual por categoría" icon={I.Box}>
          <Composition products={data.products} warehouse={warehouse} />
          <Table headers={["Categoría", "Productos", "Valor al costo"]}>
            {categories.map((c) => (
              <tr key={c}>
                <td>{c}</td>
                <td>{data.products.filter((p) => p.category === c).length}</td>
                <td>
                  {money(
                    data.products
                      .filter((p) => p.category === c)
                      .reduce((a, p) => a + stock(p, warehouse) * p.cost, 0),
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <p className="muted">
            El inventario muestra el saldo actual; no es un cierre histórico del
            período seleccionado.
          </p>
        </Panel>
      ) : (
        <Panel title="Cuentas por cobrar del período">
          <Table
            headers={["Cliente", "Comprobantes pendientes", "Saldo"]}
            empty={!invoices.some((x) => x.total > x.paid)}
          >
            {data.clients.map((c) => {
              const list = invoices.filter(
                (x) => x.client === c.id && x.total > x.paid,
              );
              return (
                list.length > 0 && (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{list.length}</td>
                    <td>
                      {money(list.reduce((a, x) => a + x.total - x.paid, 0))}
                    </td>
                  </tr>
                )
              );
            })}
          </Table>
        </Panel>
      )}
    </>
  );
}
function Settings() {
  const { data, commit, confirm } = useApp();
  const [v, setV] = useState({ ...data.settings });
  return (
    <>
      <PageTitle
        title="Configuración"
        subtitle="La información y preferencias de tu ferretería."
      />
      <div className="settings-layout">
        <Panel title="Datos del negocio" icon={I.BuildingStore}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{3}-\d{3}$/.test(v.prefix)) return;
              const s = structuredClone(data);
              s.settings = v;
              commit(s, "Configuración guardada");
            }}
          >
            <div className="form-grid">
              {[
                ["company", "Nombre del negocio"],
                ["doc", "RUC / documento"],
                ["address", "Dirección"],
                ["phone", "Teléfono"],
                ["email", "Correo electrónico"],
                ["prefix", "Serie de comprobantes"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  type={key === "email" ? "email" : "text"}
                  required
                  value={String(v[key as keyof typeof v])}
                  pattern={key === "prefix" ? "[0-9]{3}-[0-9]{3}" : undefined}
                  title={key === "prefix" ? "Formato: 001-001" : undefined}
                  onChange={(e) => setV({ ...v, [key]: e.target.value })}
                />
              ))}
            </div>
            <div className="modal-actions">
              <Button type="submit" icon={I.Check}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title="Acerca de esta maqueta" icon={I.InfoCircle}>
          <p>
            Un espacio para probar el funcionamiento de tu ferretería con datos
            de ejemplo.
          </p>
          <dl>
            <div>
              <dt>Moneda</dt>
              <dd>Guaraníes (Gs.)</dd>
            </div>
            <div>
              <dt>Depósitos</dt>
              <dd>Casa central y Norte</dd>
            </div>
            <div>
              <dt>Comprobantes</dt>
              <dd>Demostrativos</dd>
            </div>
          </dl>
          <p className="muted">
            Los cambios comerciales se guardan en este navegador. El login y los
            usuarios se consultan en NexaBack con PostgreSQL.
          </p>
          <Button
            access="configuracion.restablecer"
            variant="danger-outline"
            icon={I.Refresh}
            onClick={() =>
              confirm(
                "Restablecer datos de ejemplo",
                "Se reemplazarán los productos, ventas y movimientos de esta maqueta por los datos iniciales. Esta acción no modifica ningún sistema real.",
                () => {
                  const s = seed();
                  commit(s, "Datos de ejemplo restablecidos");
                  setV(s.settings);
                },
              )
            }
          >
            Restablecer demostración
          </Button>
        </Panel>
      </div>
      <Panel title="Actividad reciente" className="mt">
        <Table
          headers={["Fecha", "Usuario", "Acción"]}
          empty={!data.audit.length}
        >
          {data.audit.slice(0, 12).map((x) => (
            <tr key={x.id}>
              <td>{date(x.date)}</td>
              <td>{x.user}</td>
              <td>{x.action}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
