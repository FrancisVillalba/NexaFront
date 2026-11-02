import type { Icon } from "../../uiTypes";
import type { Product } from "../../types/commercial";
import * as I from "../../icons";
import { cn } from "./helpers";

// Presentación reutilizable de productos.
export function ProductImage({
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

export function ProductName({ p }: { p: Product }) {
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
