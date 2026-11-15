export const number = new Intl.NumberFormat("es-PE");

export function ha(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${number.format(Number(value.toFixed ? value.toFixed(2) : value))} ha`;
}

export function pct(value?: number | null, digits = 0) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function fecha(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function fechaHora(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mes(value: number) {
  return new Date(2024, value - 1, 1).toLocaleDateString("es-PE", { month: "short" });
}

export const CLASSIFICATION: Record<string, { label: string; tone: string; dot: string }> = {
  recomendable: { label: "Recomendable", tone: "bg-lime/40 text-ink border-lime", dot: "bg-[#4d7c0f]" },
  viable_con_restricciones: {
    label: "Viable con restricciones",
    tone: "bg-amber/20 text-[#6b4d12] border-amber/50",
    dot: "bg-amber",
  },
  no_recomendado: { label: "No recomendado", tone: "bg-clay/15 text-clay border-clay/40", dot: "bg-clay" },
  riesgo_alto: { label: "Riesgo alto", tone: "bg-clay/15 text-clay border-clay/40", dot: "bg-clay" },
  informacion_insuficiente: {
    label: "Información insuficiente",
    tone: "bg-sand text-ink/60 border-ink/15",
    dot: "bg-ink/40",
  },
};

export function classificationMeta(key?: string) {
  return (
    CLASSIFICATION[key || ""] || {
      label: key || "Sin dato",
      tone: "bg-sand text-ink/60 border-ink/15",
      dot: "bg-ink/40",
    }
  );
}
