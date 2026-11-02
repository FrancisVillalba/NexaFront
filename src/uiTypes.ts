import type {
  ButtonHTMLAttributes,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";
import type { IconProps } from "@tabler/icons-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type {
  CartItem,
  CommercialState,
  Contact,
  Invoice,
  Product,
  User,
} from "./types";

export type Icon = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  access?: string | string[];
  icon?: Icon;
  variant?: string;
};
export type FormValues = Record<string, string | number | undefined>;
export interface FormField {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  minLength?: number;
  placeholder?: string;
  options?: (string | { value: string | number; label: string })[];
  when?: (values: FormValues) => boolean;
}
export interface FormModel {
  kind: "form";
  title: string;
  fields: FormField[];
  values: FormValues;
  onSave: (values: FormValues) => void | Promise<void>;
  help?: string;
  submit?: string;
}
export type ModalModel =
  | FormModel
  | { kind: "confirm"; title: string; text: string; onConfirm: () => void }
  | { kind: "invoice" | "purchase-detail" | "statement"; id: string }
  | { kind: "purchase" };
export type Setter<T> = Dispatch<SetStateAction<T>>;
export interface AppContext {
  can: (code: string) => boolean;
  data: CommercialState;
  user: User;
  warehouse: string;
  go: (page: string) => void;
  commit: (next: CommercialState, message: string) => void;
  act: (
    fn: (state: CommercialState) => CommercialState,
    message: string,
  ) => boolean;
  notify: (text: string, error?: boolean) => void;
  form: (
    title: string,
    fields: FormField[],
    values: FormValues,
    onSave: FormModel["onSave"],
    help?: string,
    submit?: string,
  ) => void;
  confirm: (title: string, text: string, onConfirm: () => void) => void;
  modal: ModalModel | null;
  setModal: Setter<ModalModel | null>;
  movementForm: (product?: Product, type?: string) => void;
  contactForm: (type: string, item?: Contact) => void;
  viewInvoice: (invoice: Invoice) => void;
  pay: (invoice: Invoice) => void;
  openSale: () => void;
  inventoryQuery: string;
  setInventoryQuery: Setter<string>;
  inventoryFilter: string;
  setInventoryFilter: Setter<string>;
  cart: CartItem[];
  setCart: Setter<CartItem[]>;
  saleClient: string;
  setSaleClient: Setter<string>;
  saleDiscount: number;
  setSaleDiscount: Setter<number>;
  setWarehouse: Setter<string>;
}
export interface PanelProps {
  title?: string;
  icon?: Icon;
  color?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}
