import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  Info,
  Leaf,
  Search,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useSimulationExplanation } from "../lib/explain";
import { classificationMeta, fecha, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { Badge, Button, Card, DataTag, Field, Input, Modal, ScoreBar, Spinner } from "./ui";

const COMPONENT_LABELS: Record<string, string> = {
  climate: "Clima",
  soil: "Suelo",
  water: "Agua",
  terrain: "Altitud",
  calendar: "Calendario",
  rotation: "Rotación",
};

export default function SimulatorPanel({
  parcelId,
  onOpenCampaign,
}: {
  parcelId: number;
  onOpenCampaign?: () => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const explain = useSimulationExplanation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().slice(0, 10));
  const [run, setRun] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [campaignFor, setCampaignFor] = useState<any>(null);
  const [campaignDate, setCampaignDate] = useState(sowingDate);
  const [campaignBusy, setCampaignBusy] = useState(false);

  const { data: crops = [], isLoading } = useQuery<any[]>({
    queryKey: ["crops", "all"],
    queryFn: () => api("/crops?limit=200"),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return crops.slice(0, 24);
    return crops
      .filter((crop) =>
        [crop.name, crop.scientific_name, crop.botanical_family, crop.category, crop.uses]
          .filter(Boolean)
          .some((value: string) => value.toLowerCase().includes(term)),
      )
      .slice(0, 40);
  }, [crops, search]);

  const selectedCrops = crops.filter((crop) => selected.includes(crop.id));

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : prev.length >= 6 ? prev : [...prev, id],
    );
  };

  const execute = async () => {
    setError("");
    if (!selected.length) return setError("Selecciona al menos un cultivo.");
    setBusy(true);
    try {
      const data = await api(`/parcels/${parcelId}/simulations`, {
        method: "POST",
        body: JSON.stringify({ crop_ids: selected, sowing_date: sowingDate }),
      });
      setRun(data);
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["parcel", String(parcelId)] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const createCampaign = async () => {
    if (!campaignFor) return;
    setCampaignBusy(true);
    try {
      await api(`/parcels/${parcelId}/campaigns`, {
        method: "POST",
        body: JSON.stringify({
          crop_id: campaignFor.crop_id,
          planned_sowing: campaignDate,
          notes: `Creada desde simulación #${run?.id ?? ""}`,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["parcel", String(parcelId)] });
      setCampaignFor(null);
      onOpenCampaign?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCampaignBusy(false);
    }
  };

  const results = run?.results
    ? [...run.results].sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
    : [];

  if (isLoading) return <Spinner label="Cargando catálogo de cultivos…" />;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
      <Card className="h-fit p-5">
        <div className="flex items-center justify-between">
          <Badge tone="bg-ink text-lime border-ink">
            <FlaskConical size={12} /> {t("nav.simulator")}
          </Badge>
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink/35">{selected.length}/6</span>
        </div>

        <h3 className="mt-4 font-display text-2xl leading-tight tracking-tight">{t("sim.heading")}</h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink/45">
          {t("sim.help")}
        </p>

        <div className="relative mt-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("sim.search")}
            className="w-full rounded-xl border border-ink/15 bg-white/80 py-2.5 pl-9 pr-3 text-sm placeholder:text-ink/30 focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/15"
          />
        </div>

        {selectedCrops.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedCrops.map((crop) => (
              <span
                key={crop.id}
                className="inline-flex items-center gap-1 rounded-full border border-leaf/25 bg-lime/20 px-2.5 py-1 text-[11px] text-ink/75"
              >
                {crop.name}
                <button onClick={() => toggle(crop.id)} aria-label={`Quitar ${crop.name}`}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="thin-scroll mt-3 max-h-[290px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
            {filtered.map((crop) => {
              const active = selected.includes(crop.id);
              return (
                <button
                  key={crop.id}
                  onClick={() => toggle(crop.id)}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-leaf/40 bg-lime/20"
                      : "border-ink/8 bg-white/60 hover:border-ink/20 hover:bg-white"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium">{crop.name}</span>
                    <span className="block truncate text-[9px] uppercase tracking-wider text-ink/35">
                      {crop.botanical_family} · {crop.category}
                    </span>
                  </span>
                  <span className={`h-4 w-4 shrink-0 rounded-full border ${active ? "border-leaf bg-leaf" : "border-ink/20"}`} />
                </button>
              );
            })}
            {!filtered.length && <p className="py-6 text-center text-xs text-ink/40">Sin coincidencias.</p>}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label={t("sim.date")}>
            <Input type="date" value={sowingDate} onChange={(event) => setSowingDate(event.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" onClick={execute} loading={busy} disabled={!selected.length}>
              {t("sim.evaluate")} {selected.length ? `(${selected.length})` : ""}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-clay/25 bg-clay/8 px-3 py-2 text-[11px] text-clay">{error}</p>
        )}

        <p className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-ink/35">
          <Info size={12} className="mt-0.5 shrink-0" />
          {t("sim.disclaimer")}
        </p>
      </Card>

      <div className="space-y-3">
        {!run ? (
          <Card className="grid min-h-[430px] place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lime/25 text-leaf">
                <Leaf size={24} />
              </span>
              <h3 className="mt-4 font-display text-2xl tracking-tight">{t("sim.emptyTitle")}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/45">
                {t("sim.emptyText")}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <DataTag>#{run.id} · {t("sim.rules")} {run.ruleset_version}</DataTag>
                <p className="mt-1.5 text-[11px] text-ink/45">
                  {run.parcel_name} · {fecha(run.sowing_date)} · {results.length} {t("sim.crops")}
                </p>
              </div>
              <div className="text-right text-[10px] text-ink/40">
                {run.context?.climate?.available ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-leaf" /> {t("sim.connected")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-clay">
                    <AlertTriangle size={12} /> {t("sim.noClimate")}
                  </span>
                )}
                <p className="mt-0.5">{run.context?.climate?.meta?.product || "Datos declarados"}</p>
              </div>
            </Card>

            {results.map((result: any) => {
              const meta = classificationMeta(result.classification);
              const isOpen = expanded === result.id;
              return (
                <Card key={result.id} className="overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/35">
                          {result.crop_family}
                        </p>
                        <h3 className="mt-0.5 font-display text-2xl leading-tight tracking-tight">
                          {result.crop_name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-3xl leading-none tabular-nums">{pct(result.score)}</p>
                        <p className="text-[9px] uppercase tracking-[0.16em] text-ink/35">{t("sim.aptitude")}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={meta.tone}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {t(`class.${result.classification}`)}
                      </Badge>
                      <Badge tone="bg-sand border-ink/10 text-ink/50">
                        {t("common.confidence")} {pct(result.confidence)}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <ScoreBar
                        value={result.score}
                        tone={
                          result.classification === "recomendable"
                            ? "bg-[#5f8a1f]"
                            : result.classification === "viable_con_restricciones"
                              ? "bg-amber"
                              : "bg-clay"
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                      {Object.entries(result.components || {}).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex items-center justify-between text-[10px] text-ink/45">
                            <span>{t(`suit.${key}`)}</span>
                            <span className="tabular-nums">{pct(value as number)}</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/8">
                            <div className="h-full rounded-full bg-leaf/70" style={{ width: `${(value as number) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-[11px] leading-relaxed text-ink/50">{explain(result)}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setExpanded(isOpen ? null : result.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink/55 transition hover:text-ink"
                      >
                        {t("sim.factors")} <ChevronDown size={13} className={isOpen ? "rotate-180 transition" : "transition"} />
                      </button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCampaignFor(result);
                            setCampaignDate(sowingDate);
                          }}
                        >
                          <CalendarPlus size={13} /> {t("sim.convert")}
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 space-y-2 rounded-2xl border border-ink/8 bg-sand/40 p-3.5">
                        {(result.factors || []).map((factor: any, index: number) => (
                          <div key={`${factor.key}-${index}`} className="flex items-start gap-2.5 text-[11px]">
                            <span
                              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                                factor.status === "critical"
                                  ? "bg-clay"
                                  : factor.status === "warning"
                                    ? "bg-amber"
                                    : factor.status === "missing"
                                      ? "bg-ink/30"
                                      : "bg-leaf"
                              }`}
                            />
                            <div>
                              <span className="font-medium text-ink/70">{factor.label}: </span>
                              <span className="text-ink/50">{factor.detail}</span>
                              <span className="ml-1 text-[9px] uppercase tracking-wider text-ink/25">{factor.source}</span>
                            </div>
                          </div>
                        ))}
                        {result.missing?.length > 0 && (
                          <p className="border-t border-ink/10 pt-2 text-[10px] text-ink/45">
                            {t("sim.missing")}: {result.missing.join(", ")}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            <p className="px-1 text-[10px] leading-relaxed text-ink/35">
              {run.context?.disclaimer}{" "}
              {run.context?.missing_data?.length
                ? `Datos faltantes globales: ${run.context.missing_data.join(", ")}.`
                : ""}
            </p>
          </>
        )}
      </div>

      <Modal open={Boolean(campaignFor)} onClose={() => setCampaignFor(null)} title={t("sim.convert")}>
        <div className="space-y-4">
          <p className="text-sm text-ink/55">
            {campaignFor?.crop_name} · {t("sim.date")}
          </p>
          <Field label={t("sim.date")}>
            <Input type="date" value={campaignDate} onChange={(event) => setCampaignDate(event.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCampaignFor(null)}>{t("common.cancel")}</Button>
            <Button onClick={createCampaign} loading={campaignBusy}>
              {t("common.create")} <ArrowUpRight size={14} />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
