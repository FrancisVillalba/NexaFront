
// Tipos de productos y operaciones comerciales de la demostración.
export interface Product {
  id: number;
  code: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  stocks: Record<string, number>;
  min: number;
  cost: number;
  price: number;
  image?: string;
}
export interface Contact {
  id: string;
  name: string;
  doc: string;
  phone: string;
  email: string;
  address: string;
  credit?: number;
}
export interface Client extends Contact {
  credit: number;
}
export interface CartItem {
  productId: number;
  qty: number;
}
export interface InvoiceItem extends CartItem {
  name: string;
  unit: string;
  price: number;
  cost: number;
}
export interface Invoice {
  id: string;
  number: string;
  date: string;
  client: string;
  warehouse: string;
  items: InvoiceItem[];
  discount: number;
  total: number;
  paid: number;
  payment: string;
  state: string;
}
export interface PurchaseItem extends CartItem {
  name: string;
  cost: number;
}
export interface Purchase {
  id: string;
  number: string;
  date: string;
  supplier: string;
  warehouse: string;
  items: PurchaseItem[];
  total: number;
  state: string;
}
export interface Quote {
  id: string;
  number: string;
  date: string;
  client: string;
  warehouse: string;
  items: CartItem[];
  discount: number;
  total: number;
  state: string;
}
export interface Movement {
  id: string;
  date: string;
  productId: number;
  type: string;
  qty: number;
  warehouse: string;
  reason: string;
  user: string;
}
export interface CashEntry {
  id: string;
  date: string;
  type: string;
  amount: number;
  reason: string;
  method: string;
}
export interface CashClosing {
  id: string;
  date: string;
  opening: number;
  expected: number;
  counted: number;
  difference: number;
}
export interface CashState {
  open: boolean;
  opening: number;
  openedAt: string;
  entries: CashEntry[];
  history: CashClosing[];
}
export interface Settings {
  company: string;
  doc: string;
  address: string;
  phone: string;
  email: string;
  prefix: string;
  minAlert: boolean;
}
export interface CommercialState {
  products: Product[];
  clients: Client[];
  suppliers: Contact[];
  invoices: Invoice[];
  purchases: Purchase[];
  movements: Movement[];
  quotes: Quote[];
  cash: CashState;
  settings: Settings;
  audit: { id: string; date: string; user: string; action: string }[];
}
export interface MovementInput {
  productId: number | string;
  qty: number | string;
  reason: string;
  type: string;
  warehouse: string;
  destination: string;
}
export interface CheckoutInput {
  items: CartItem[];
  client: string;
  warehouse: string;
  discount: number | string;
  received: number | string;
  payment: string;
}
