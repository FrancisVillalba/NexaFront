import type {
  Product,
  CommercialState,
  MovementInput,
  CheckoutInput,
  CashState,
} from "./types";
export const TODAY = "2026-10-26";
export const warehouses = ["Casa central", "Depósito Norte"];
export const categories = [
  "Herramientas",
  "Pinturas",
  "Tornillería",
  "Electricidad",
  "Plomería",
  "Construcción",
  "Seguridad",
];
export const uid = () => globalThis.crypto.randomUUID();
export const money = (v: number | string | undefined) =>
  "Gs. " +
  new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(
    Number(v) || 0,
  );
export const num = (v: number | string | undefined) =>
  new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(
    Number(v) || 0,
  );
export const date = (v: string) =>
  new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(v + "T12:00:00"));
export const stock = (p: Product, w = "Casa central") =>
  Number(p.stocks[w] || 0);
export const status = (p: Product, w: string) =>
  stock(p, w) === 0
    ? "Sin stock"
    : stock(p, w) <= p.min
      ? "Stock bajo"
      : "Disponible";
const product = (
  id: number,
  code: string,
  name: string,
  brand: string,
  category: string,
  unit: string,
  qty: number,
  north: number,
  min: number,
  cost: number,
  price: number,
  image = "",
): Product => ({
  id,
  code,
  barcode: "784" + String(id).padStart(10, "0"),
  name,
  brand,
  category,
  unit,
  stocks: { "Casa central": qty, "Depósito Norte": north },
  min,
  cost,
  price,
  image,
});
export function seed(): CommercialState {
  return {
    products: [
      product(
        1,
        "HER-001",
        "Taladro inalámbrico 20 V",
        "Ferro Pro",
        "Herramientas",
        "unidad",
        12,
        4,
        5,
        360000,
        485000,
        "drill",
      ),
      product(
        2,
        "PIN-001",
        "Látex interior blanco 4 L",
        "Color Plus",
        "Pinturas",
        "unidad",
        4,
        8,
        10,
        58000,
        85000,
        "paint",
      ),
      product(
        3,
        "HER-002",
        "Martillo de uña 16 oz",
        "Ferro Pro",
        "Herramientas",
        "unidad",
        6,
        3,
        8,
        28000,
        45000,
        "hammer",
      ),
      product(
        4,
        "TOR-001",
        "Tornillo autoperforante 8 × 1”",
        "Fixer",
        "Tornillería",
        "caja",
        8,
        5,
        15,
        20000,
        32000,
      ),
      product(
        5,
        "ELE-001",
        "Cable unipolar 2,5 mm²",
        "Electro Sur",
        "Electricidad",
        "metro",
        120,
        80,
        150,
        3200,
        5500,
      ),
      product(
        6,
        "PLO-001",
        "Codo PVC 1/2”",
        "Aqua",
        "Plomería",
        "unidad",
        0,
        25,
        20,
        1200,
        2500,
      ),
      product(
        7,
        "CON-001",
        "Cemento portland 50 kg",
        "Construmax",
        "Construcción",
        "bolsa",
        32,
        50,
        20,
        43000,
        58000,
      ),
      product(
        8,
        "SEG-001",
        "Guantes de trabajo reforzados",
        "Safe Pro",
        "Seguridad",
        "par",
        18,
        10,
        10,
        8500,
        15000,
      ),
      product(
        9,
        "TOR-002",
        "Clavo de acero 2”",
        "Fixer",
        "Tornillería",
        "kilo",
        4.5,
        12,
        10,
        9000,
        16000,
      ),
      product(
        10,
        "PLO-002",
        "Cinta teflón 12 mm × 10 m",
        "Aqua",
        "Plomería",
        "unidad",
        48,
        24,
        15,
        1800,
        3500,
      ),
      product(
        11,
        "PIN-002",
        "Esmalte sintético azul 1 L",
        "Color Plus",
        "Pinturas",
        "unidad",
        15,
        8,
        8,
        30000,
        48000,
        "paint",
      ),
      product(
        12,
        "HER-003",
        "Taladro percutor 650 W",
        "Ferro Pro",
        "Herramientas",
        "unidad",
        7,
        2,
        4,
        210000,
        295000,
        "drill",
      ),
    ],
    clients: [
      {
        id: "c1",
        name: "Consumidor final",
        doc: "Sin documento",
        phone: "",
        email: "",
        address: "",
        credit: 0,
      },
      {
        id: "c2",
        name: "Constructora Horizonte",
        doc: "80012345-6",
        phone: "0981 555 210",
        email: "compras@horizonte.example",
        address: "Av. Principal 850",
        credit: 5000000,
      },
      {
        id: "c3",
        name: "María González",
        doc: "3456789",
        phone: "0982 234 567",
        email: "maria@example.com",
        address: "Barrio Centro",
        credit: 1500000,
      },
      {
        id: "c4",
        name: "Taller San José",
        doc: "80145678-9",
        phone: "0971 444 321",
        email: "taller@example.com",
        address: "Ruta 2 km 15",
        credit: 3000000,
      },
    ],
    suppliers: [
      {
        id: "s1",
        name: "Distribuidora Ferretera del Sur",
        doc: "80045678-1",
        phone: "021 555 340",
        email: "ventas@ferresur.example",
        address: "Av. Industrial 450",
      },
      {
        id: "s2",
        name: "Pinturas y Acabados S.A.",
        doc: "80023456-7",
        phone: "021 444 220",
        email: "pedidos@pinturas.example",
        address: "Calle Comercio 120",
      },
      {
        id: "s3",
        name: "Materiales del Norte",
        doc: "80098765-4",
        phone: "0981 800 500",
        email: "ventas@materiales.example",
        address: "Ruta 3 km 22",
      },
    ],
    invoices: [
      {
        id: "f1",
        number: "001-001-0001256",
        date: TODAY,
        client: "c2",
        warehouse: "Casa central",
        items: [
          {
            productId: 1,
            name: "Taladro inalámbrico 20 V",
            unit: "unidad",
            qty: 2,
            price: 485000,
            cost: 360000,
          },
        ],
        discount: 0,
        total: 970000,
        paid: 0,
        payment: "Crédito",
        state: "Pendiente",
      },
      {
        id: "f2",
        number: "001-001-0001255",
        date: TODAY,
        client: "c3",
        warehouse: "Casa central",
        items: [
          {
            productId: 7,
            name: "Cemento portland 50 kg",
            unit: "bolsa",
            qty: 10,
            price: 58000,
            cost: 43000,
          },
        ],
        discount: 0,
        total: 580000,
        paid: 580000,
        payment: "Efectivo",
        state: "Pagada",
      },
      {
        id: "f3",
        number: "001-001-0001254",
        date: TODAY,
        client: "c4",
        warehouse: "Casa central",
        items: [
          {
            productId: 3,
            name: "Martillo de uña 16 oz",
            unit: "unidad",
            qty: 3,
            price: 45000,
            cost: 28000,
          },
        ],
        discount: 0,
        total: 135000,
        paid: 135000,
        payment: "Tarjeta",
        state: "Pagada",
      },
      {
        id: "f4",
        number: "001-001-0001253",
        date: "2026-10-25",
        client: "c2",
        warehouse: "Casa central",
        items: [
          {
            productId: 5,
            name: "Cable unipolar 2,5 mm²",
            unit: "metro",
            qty: 100,
            price: 5500,
            cost: 3200,
          },
        ],
        discount: 0,
        total: 550000,
        paid: 250000,
        payment: "Crédito",
        state: "Parcial",
      },
      {
        id: "f5",
        number: "001-001-0001252",
        date: "2026-10-24",
        client: "c3",
        warehouse: "Casa central",
        items: [
          {
            productId: 2,
            name: "Látex interior blanco 4 L",
            unit: "unidad",
            qty: 6,
            price: 85000,
            cost: 58000,
          },
        ],
        discount: 0,
        total: 510000,
        paid: 510000,
        payment: "Transferencia",
        state: "Pagada",
      },
      {
        id: "f6",
        number: "001-001-0001251",
        date: "2026-10-23",
        client: "c4",
        warehouse: "Casa central",
        items: [
          {
            productId: 1,
            name: "Taladro inalámbrico 20 V",
            unit: "unidad",
            qty: 1,
            price: 485000,
            cost: 360000,
          },
        ],
        discount: 0,
        total: 485000,
        paid: 485000,
        payment: "Efectivo",
        state: "Pagada",
      },
    ],
    purchases: [
      {
        id: "o1",
        number: "OC-00128",
        date: TODAY,
        supplier: "s1",
        warehouse: "Casa central",
        items: [
          { productId: 3, name: "Martillo de uña 16 oz", qty: 20, cost: 28000 },
          {
            productId: 4,
            name: "Tornillo autoperforante 8 × 1”",
            qty: 30,
            cost: 20000,
          },
        ],
        total: 1160000,
        state: "Pendiente",
      },
      {
        id: "o2",
        number: "OC-00127",
        date: "2026-10-25",
        supplier: "s2",
        warehouse: "Casa central",
        items: [
          {
            productId: 2,
            name: "Látex interior blanco 4 L",
            qty: 12,
            cost: 58000,
          },
        ],
        total: 696000,
        state: "Recibida",
      },
    ],
    movements: [
      {
        id: "m1",
        date: TODAY,
        productId: 7,
        type: "Venta",
        qty: -10,
        warehouse: "Casa central",
        reason: "Factura 001-001-0001255",
        user: "Ana López",
      },
      {
        id: "m2",
        date: TODAY,
        productId: 1,
        type: "Venta",
        qty: -2,
        warehouse: "Casa central",
        reason: "Factura 001-001-0001256",
        user: "Francisco Villalba",
      },
      {
        id: "m3",
        date: "2026-10-25",
        productId: 2,
        type: "Entrada",
        qty: 12,
        warehouse: "Casa central",
        reason: "Recepción OC-00127",
        user: "Carlos Benítez",
      },
      {
        id: "m4",
        date: "2026-10-25",
        productId: 5,
        type: "Venta",
        qty: -100,
        warehouse: "Casa central",
        reason: "Factura 001-001-0001253",
        user: "Ana López",
      },
    ],
    quotes: [],
    cash: {
      open: true,
      opening: 500000,
      openedAt: TODAY,
      entries: [
        {
          id: "e1",
          date: TODAY,
          type: "Ingreso",
          amount: 580000,
          reason: "Venta 001-001-0001255",
          method: "Efectivo",
        },
      ],
      history: [],
    },
    settings: {
      company: "Ferretería Central",
      doc: "80012345-0",
      address: "Av. Principal 1234 · Asunción",
      phone: "021 555 000",
      email: "info@ferreteria.example",
      prefix: "001-001",
      minAlert: true,
    },
    audit: [],
  };
}
const clone = (s: CommercialState) => structuredClone(s);
const positive = (n: number | string, label: string) => {
  if (!Number.isFinite(Number(n)) || Number(n) <= 0)
    throw Error(label + " debe ser mayor que cero.");
  return Number(n);
};
export function validQty(p: Product, qty: number | string) {
  positive(qty, "La cantidad");
  if (!["metro", "kilo"].includes(p.unit) && !Number.isInteger(Number(qty)))
    throw Error("Usá cantidades enteras para " + p.name + ".");
}
export function applyMovement(
  state: CommercialState,
  input: MovementInput,
  user: string,
) {
  const s = clone(state),
    p = s.products.find((x) => x.id === Number(input.productId));
  if (!p) throw Error("Seleccioná un producto.");
  const qty = positive(input.qty, "La cantidad");
  validQty(p, qty);
  if (!input.reason?.trim()) throw Error("Indicá el motivo del movimiento.");
  if (!warehouses.includes(input.warehouse)) throw Error("Depósito inválido.");
  const add = (w: string, q: number, type: string) => {
    p.stocks[w] = Math.round((stock(p, w) + q) * 100) / 100;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type,
      qty: q,
      warehouse: w,
      reason: input.reason,
      user,
    });
  };
  if (input.type === "Transferencia") {
    if (
      input.destination === input.warehouse ||
      !warehouses.includes(input.destination)
    )
      throw Error("Seleccioná otro depósito de destino.");
    if (qty > stock(p, input.warehouse))
      throw Error("No hay stock suficiente para la transferencia.");
    add(input.warehouse, -qty, "Transferencia salida");
    add(input.destination, qty, "Transferencia entrada");
  } else {
    const q = input.type === "Salida" ? -qty : qty;
    if (stock(p, input.warehouse) + q < 0)
      throw Error("No hay stock suficiente para la salida.");
    add(
      input.warehouse,
      q,
      input.type === "Ajuste" ? "Ajuste positivo" : input.type,
    );
  }
  return s;
}
export function checkout(
  state: CommercialState,
  input: CheckoutInput,
  user: string,
) {
  const s = clone(state);
  if (!input.items.length) throw Error("Agregá al menos un producto.");
  if (!s.clients.some((c) => c.id === input.client))
    throw Error("Seleccioná un cliente.");
  const combined = new Map<number, number>();
  input.items.forEach((x) =>
    combined.set(x.productId, (combined.get(x.productId) || 0) + Number(x.qty)),
  );
  const items = [...combined].map(([id, qty]) => {
    const p = s.products.find((x) => x.id === id);
    if (!p) throw Error("Producto inexistente.");
    validQty(p, qty);
    if (qty > stock(p, input.warehouse))
      throw Error(
        "Stock insuficiente: " +
          p.name +
          ". Disponible: " +
          stock(p, input.warehouse),
      );
    return {
      productId: id,
      name: p.name,
      unit: p.unit,
      qty,
      price: p.price,
      cost: p.cost,
    };
  });
  const subtotal = items.reduce((a, x) => a + x.qty * x.price, 0),
    discount = Number(input.discount) || 0;
  if (discount < 0 || discount > subtotal)
    throw Error("El descuento no puede superar el subtotal.");
  const total = Math.round(subtotal - discount);
  if (total <= 0) throw Error("El total debe ser mayor que cero.");
  const credit = input.payment === "Crédito";
  if (credit && input.client === "c1")
    throw Error("Seleccioná un cliente identificado para vender a crédito.");
  if (credit) {
    const c = s.clients.find((x) => x.id === input.client)!,
      debt = s.invoices
        .filter((x) => x.client === c.id && x.state !== "Anulada")
        .reduce((a, x) => a + x.total - x.paid, 0);
    if (total + debt > c.credit)
      throw Error("La venta supera el límite de crédito del cliente.");
  }
  if (!credit && !s.cash.open)
    throw Error("Abrí la caja antes de registrar un cobro.");
  if (input.payment === "Efectivo" && Number(input.received) < total)
    throw Error("El monto recibido es insuficiente.");
  const number =
    s.settings.prefix +
    "-" +
    String(
      1257 +
        s.invoices.filter(
          (x) => !["f1", "f2", "f3", "f4", "f5", "f6"].includes(x.id),
        ).length,
    ).padStart(7, "0");
  const invoice = {
    id: uid(),
    number,
    date: TODAY,
    client: input.client,
    warehouse: input.warehouse,
    items,
    discount,
    total,
    paid: credit ? 0 : total,
    payment: input.payment,
    state: credit ? "Pendiente" : "Pagada",
  };
  items.forEach((x) => {
    const p = s.products.find((p) => p.id === x.productId)!;
    p.stocks[input.warehouse] =
      Math.round((stock(p, input.warehouse) - x.qty) * 100) / 100;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type: "Venta",
      qty: -x.qty,
      warehouse: input.warehouse,
      reason: "Factura " + number,
      user,
    });
  });
  s.invoices.unshift(invoice);
  if (!credit)
    s.cash.entries.unshift({
      id: uid(),
      date: TODAY,
      type: "Ingreso",
      amount: total,
      reason: "Venta " + number,
      method: input.payment,
    });
  return { state: s, invoice };
}
export function receivePurchase(
  state: CommercialState,
  id: string,
  user: string,
) {
  const s = clone(state),
    o = s.purchases.find((x) => x.id === id);
  if (!o || o.state !== "Pendiente")
    throw Error("La orden ya fue recibida o anulada.");
  o.items.forEach((x) => {
    const p = s.products.find((p) => p.id === x.productId)!;
    validQty(p, x.qty);
    p.stocks[o.warehouse] =
      Math.round((stock(p, o.warehouse) + x.qty) * 100) / 100;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type: "Entrada",
      qty: x.qty,
      warehouse: o.warehouse,
      reason: "Recepción " + o.number,
      user,
    });
  });
  o.state = "Recibida";
  return s;
}
export function payInvoice(
  state: CommercialState,
  id: string,
  amount: number,
  method: string,
) {
  const s = clone(state),
    inv = s.invoices.find((x) => x.id === id);
  if (!s.cash.open) throw Error("Abrí la caja para registrar un cobro.");
  if (!inv || inv.state === "Anulada") throw Error("Factura inválida.");
  const a = positive(amount, "El importe");
  if (a > inv.total - inv.paid)
    throw Error("El importe supera el saldo pendiente.");
  inv.paid += a;
  inv.state = inv.paid === inv.total ? "Pagada" : "Parcial";
  s.cash.entries.unshift({
    id: uid(),
    date: TODAY,
    type: "Ingreso",
    amount: a,
    reason: "Cobro " + inv.number,
    method,
  });
  return s;
}
export function voidInvoice(state: CommercialState, id: string, user: string) {
  const s = clone(state),
    inv = s.invoices.find((x) => x.id === id);
  if (!inv || inv.state === "Anulada") throw Error("La venta ya fue anulada.");
  if (inv.paid > 0 && !s.cash.open)
    throw Error("Abrí la caja para registrar la devolución.");
  inv.items.forEach((x) => {
    const p = s.products.find((p) => p.id === x.productId)!;
    p.stocks[inv.warehouse] += x.qty;
    s.movements.unshift({
      id: uid(),
      date: TODAY,
      productId: p.id,
      type: "Devolución",
      qty: x.qty,
      warehouse: inv.warehouse,
      reason: "Anulación " + inv.number,
      user,
    });
  });
  if (inv.paid)
    s.cash.entries.unshift({
      id: uid(),
      date: TODAY,
      type: "Egreso",
      amount: inv.paid,
      reason: "Devolución " + inv.number,
      method: inv.payment === "Crédito" ? "Efectivo" : inv.payment,
    });
  inv.state = "Anulada";
  return s;
}
export const cashExpected = (c: CashState) =>
  c.opening +
  c.entries
    .filter((e) => e.method === "Efectivo")
    .reduce((a, e) => a + (e.type === "Ingreso" ? e.amount : -e.amount), 0);
export function csv(filename: string, headers: string[], rows: unknown[][]) {
  const text =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) =>
        row
          .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
          .join(";"),
      )
      .join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
