import { clsx } from "clsx";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center select-none">
        <span
          className={clsx(
            "grid place-items-center rounded-[14px] h-10 w-10 shrink-0 overflow-hidden p-1",
            light ? "bg-cream" : "bg-white ring-1 ring-ink/10",
          )}
        >
          <img src="/logo-emblem.png" alt="ROOTWISE AI" className="h-full w-full object-contain" draggable={false} />
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center select-none">
      <span
        className={clsx(
          "inline-flex items-center rounded-[14px] px-2.5 py-1.5",
          light ? "bg-cream shadow-[0_10px_30px_-18px_rgba(0,0,0,.8)]" : "bg-white ring-1 ring-ink/10",
        )}
      >
        <img
          src="/logo-nav.png"
          alt="ROOTWISE AI — Cultiva decisiones, cosecha futuro"
          className="h-8 w-auto sm:h-9"
          draggable={false}
        />
      </span>
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "lime" | "outline" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", className, loading, children, disabled, ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-ink text-cream hover:bg-[#173b2d] border border-ink",
    lime: "bg-lime text-ink hover:bg-[#d7eda6] border border-lime",
    outline: "bg-transparent text-ink border border-ink/20 hover:border-ink/45 hover:bg-white/60",
    ghost: "bg-transparent text-ink/70 border border-transparent hover:bg-ink/5 hover:text-ink",
    danger: "bg-clay/10 text-clay border border-clay/25 hover:bg-clay/15",
    dark: "bg-white/10 text-cream border border-white/15 hover:bg-white/15",
  };
  const sizes: Record<string, string> = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2.5 rounded-xl gap-2",
    lg: "text-[15px] px-6 py-3.5 rounded-2xl gap-2.5",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-offset-2",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "bg-white/85 border border-ink/10 rounded-3xl shadow-soft backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "bg-sand text-ink/70 border-ink/10",
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none",
        tone,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px] font-medium text-ink/70">
        {label}
        {hint && <span className="text-[10px] font-normal text-ink/40">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const control =
  "w-full rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 transition focus:border-leaf focus:bg-white focus:outline-none focus:ring-2 focus:ring-leaf/15";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(control, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(control, "appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(control, "min-h-[92px] resize-y", className)} {...props} />;
}

export function Spinner({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-ink/50">
      <span className="h-4 w-4 rounded-full border-2 border-leaf border-t-transparent animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-sand text-ink/50">{icon}</div>}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-ink/55">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className={clsx("w-full rounded-t-3xl bg-cream p-6 shadow-lift sm:rounded-3xl", width)}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl tracking-tight text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-leaf">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl leading-tight tracking-[-0.03em] text-ink sm:text-[2.6rem]">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/55">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45">{label}</p>
        {icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand/80 text-leaf">{icon}</span>}
      </div>
      <p className="mt-3 font-display text-3xl leading-none tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </Card>
  );
}

export function DataTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-ink/10 bg-sand/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-ink/50">
      <span className="h-1.5 w-1.5 rounded-full bg-leaf/70" />
      {children}
    </span>
  );
}

export function ScoreBar({ value, tone = "bg-leaf" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
      <div
        className={clsx("h-full rounded-full transition-all duration-700", tone)}
        style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }}
      />
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-white/60 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition",
            active === tab.id ? "rw-tab-active shadow-sm" : "text-ink/55 hover:text-ink hover:bg-ink/5",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
