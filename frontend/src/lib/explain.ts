import { useI18n } from "./i18n";

type Result = {
  crop_name?: string;
  classification?: string;
  score?: number;
  components?: Record<string, number>;
  critical?: string[];
  missing?: string[];
};

export function useSimulationExplanation() {
  const { t } = useI18n();

  return (result: Result): string => {
    const components = result.components || {};
    const entries = Object.entries(components);
    const best = [...entries].sort((a, b) => b[1] - a[1]).slice(0, 2);
    const weak = [...entries].sort((a, b) => a[1] - b[1]).slice(0, 2);
    const score = Math.round((result.score ?? 0) * 100);
    const list = (items: [string, number][]) =>
      items.map(([key, value]) => `${t(`suit.${key}`)} (${Math.round(value * 100)}%)`).join(", ");

    const parts = [
      t("sim.summary", {
        crop: result.crop_name ?? "",
        label: t(`class.${result.classification ?? "recomendable"}`).toLowerCase(),
        score,
      }),
    ];
    if (best.length) parts.push(t("sim.best", { list: list(best) }));
    if (weak.length) parts.push(t("sim.weak", { list: list(weak) }));
    if (result.critical?.length) parts.push(t("sim.critical", { list: result.critical.join(" ") }));
    if (result.missing?.length) parts.push(t("sim.missingList", { list: result.missing.join(", ") }));
    parts.push(t("sim.methodNote"));
    return parts.join(" ");
  };
}
