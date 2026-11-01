import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import type { Icon } from "../uiTypes";
import React, { useEffect, useRef } from "react";
import * as I from "../icons";
const cn = (...a: (string | false | undefined)[]) =>
  a.filter(Boolean).join(" ");

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className={cn("brand", "image-brand", dark && "dark")}>
      <span className="logo-window">
        <img src="/assets/nexa-logo.png" alt="NEXA" />
      </span>
    </div>
  );
}

export function IconButton({
  icon: Icon,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: Icon; label: string }) {
  return (
    <button className="icon-btn" aria-label={label} title={label} {...props}>
      <Icon size={19} />
    </button>
  );
}

export function Field({
  label,
  children,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  children?: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const old = document.activeElement,
      prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input,select,button")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = ref.current!.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,select,textarea,a[href]",
          ),
          first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handler);
      (old as HTMLElement | null)?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        className={cn("modal", wide && "wide", className)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <IconButton icon={I.X} label="Cerrar ventana" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}
