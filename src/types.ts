// Contratos de NexaBack: equivalen a los DTOs que recibe y devuelve la API C#.
export interface SessionUserDto {
  accesos: string[];
  usuarioId: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  documento: string | null;
  perfilId: number;
  perfil: string;
}
export interface LoginResponse {
  token: string;
  tipoToken: string;
  expiraEn: string;
  usuario: SessionUserDto;
}
export interface AuthSession {
  token: string;
  expiraEn: string;
}
export interface User {
  accesses: string[];
  id: number;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  document: string | null;
  profileId: number;
  role: string;
  active: boolean;
}
export interface PersonDto {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  creadoEn: string;
}
export interface ProfileDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creadoEn: string;
}
export interface UserDto {
  id: number;
  nombreUsuario: string;
  personaId: number;
  perfilId: number;
  activo: boolean;
  creadoEn: string;
}
export interface DirectoryUser {
  id: number;
  personId: number;
  profileId: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
  personActive: boolean;
  profileActive: boolean;
  document: string | null;
}
export interface UserDirectory {
  users: DirectoryUser[];
  people: PersonDto[];
  profiles: ProfileDto[];
}

// Modelos comerciales locales; todavía no son entidades persistidas en la API.
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
