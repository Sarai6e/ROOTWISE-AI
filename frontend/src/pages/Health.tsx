import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ImageUp,
  Leaf,
  Microscope,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { api } from "../lib/api";
import { fecha, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { Badge, Button, Card, DataTag, EmptyState, Field, Input, PageHeader, ScoreBar, Select, Spinner, Textarea } from "../components/ui";

export default function Health() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [parcelId, setParcelId] = useState("");

  const [observation, setObservation] = useState({
    symptoms: "", severity: "media", observed_at: new Date().toISOString().slice(0, 10), notes: "",
  });

  const { data: capabilities, isLoading: capabilitiesLoading } = useQuery<any>({
    queryKey: ["health", "capabilities"],
    queryFn: () => api("/health/capabilities"),
  });

  const { data: farms = [] } = useQuery<any[]>({
    queryKey: ["farms"],
    queryFn: () => api("/farms"),
  });

  const parcels = useMemo(
    () => farms.flatMap((farm) => (farm.parcels || []).map((parcel: any) => ({ ...parcel, farm_name: farm.name }))),
    [farms],
  );

  const { data: observations = [] } = useQuery<any[]>({
    queryKey: ["observations"],
    queryFn: () => api("/health/observations"),
  });

  const choose = (selected?: File | null) => {
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(selected));
  };

  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      if (parcelId) form.append("parcel_id", parcelId);
      const data = await api("/health/diagnose", { method: "POST", body: form });
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addObservation = async () => {
    if (!observation.symptoms.trim() || !parcels.length) return;
    try {
      await api("/health/observations", {
        method: "POST",
        body: JSON.stringify({
          ...observation,
          parcel_id: Number(parcelId || parcels[0].id),
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      setObservation({ ...observation, symptoms: "", notes: "" });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeObservation = async (id: number) => {
    await api(`/health/observations/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["observations"] });
  };

  if (capabilitiesLoading) return <Spinner label="Verificando modelo de IA…" />;

  const modelReady = Boolean(capabilities?.model_available);

  return (
    <div>
      <PageHeader
        eyebrow="ROOTWISE HEALTH"
        title={t("health.title")}
        description={t("health.desc")}
        actions={
          <Badge tone={modelReady ? "bg-lime/30 border-lime/50 text-ink" : "bg-amber/20 border-amber/40 text-[#6b4d12]"}>
            <Sparkles size={12} /> {modelReady ? t("health.active") : t("health.inactive")}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <DataTag>{t("health.diagnosisTag")}</DataTag>
            <Stethoscope size={16} className="text-leaf/60" />
          </div>
          <h3 className="mt-3 font-display text-2xl leading-tight tracking-tight">{t("health.upload")}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
            {t("health.uploadHint")}
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            className="mt-4 grid h-56 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-sand/40 transition hover:border-leaf/50 hover:bg-lime/10"
          >
            {preview ? (
              <img src={preview} alt="Vista previa de la hoja" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center">
                <ImageUp size={26} className="mx-auto text-ink/30" />
                <p className="mt-2 text-xs font-medium text-ink/55">Haz clic o arrastra una imagen</p>
                <p className="text-[10px] text-ink/35">Una sola hoja, fondo uniforme, buena luz</p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => choose(event.target.files?.[0])}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={t("health.parcel")} hint={t("common.optional")}>
              <Select value={parcelId} onChange={(event) => setParcelId(event.target.value)}>
                <option value="">—</option>
                {parcels.map((parcel) => <option key={parcel.id} value={parcel.id}>{parcel.name}</option>)}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button className="w-full" onClick={analyze} loading={busy} disabled={!file || !modelReady}>
                {t("health.analyze")}
              </Button>
            </div>
          </div>

          {!modelReady && (
            <div className="mt-4 rounded-xl border border-amber/35 bg-amber/10 px-3.5 py-3 text-[11px] leading-relaxed text-[#6b4d12]">
              <p className="flex items-center gap-1.5 font-medium"><AlertTriangle size={13} /> Módulo opcional inactivo</p>
              <p className="mt-1">{capabilities?.reason}</p>
              <p className="mt-1.5">
                Actívalo con <code className="rounded bg-ink/8 px-1">pip install -r backend/requirements-ml.txt</code>.
                Sin él, el resto de la app sigue operativa.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-xl border border-clay/25 bg-clay/8 px-3.5 py-2.5 text-[11px] text-clay">{error}</p>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <DataTag>{t("health.result")}</DataTag>
              <Leaf size={15} className="text-leaf/60" />
            </div>
            {result ? (
              <div className="mt-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink/35">{t("health.main")}</p>
                    <h3 className="mt-1 font-display text-3xl leading-tight">
                      {t(`leaf.${(result.predictions[0]?.class || "").replace(/[^a-zA-Z0-9]/g, "_")}`)}
                    </h3>
                  </div>
                  <p className="font-display text-4xl leading-none tabular-nums">
                    {pct(result.predictions[0]?.score)}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {result.predictions.map((prediction: any) => (
                    <div key={prediction.class}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-ink/60">
                          {t(`leaf.${String(prediction.class).replace(/[^a-zA-Z0-9]/g, "_")}`)}
                        </span>
                        <span className="tabular-nums text-ink/40">{pct(prediction.score, 1)}</span>
                      </div>
                      <div className="mt-1"><ScoreBar value={prediction.score} /></div>
                      {prediction.advice && (
                        <p className="mt-1 text-[10px] leading-relaxed text-ink/40">
                          {t(`mip.${String(prediction.class).replace(/[^a-zA-Z0-9]/g, "_")}`)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-4 rounded-xl border border-ink/8 bg-sand/50 px-3 py-2.5 text-[10px] leading-relaxed text-ink/45">
                  {t("health.mipNote")} {t("health.model")} {result.model_version}.
                </p>
              </div>
            ) : (
              <div className="py-10 text-center">
                <Microscope size={26} className="mx-auto text-ink/20" />
                <p className="mt-3 text-sm text-ink/45">{t("health.emptyResult")}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <DataTag>{t("health.modelCard")}</DataTag>
                <p className="mt-1.5 text-[11px] text-ink/45">
                  MobileNetV2 · PlantVillage · {capabilities?.classes?.length || 10} {t("health.classes")}
                </p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="font-display text-xl leading-none">{pct(capabilities?.metrics?.f1_macro, 1)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-ink/35">F1 macro</p>
                </div>
                <div>
                  <p className="font-display text-xl leading-none">{pct(capabilities?.metrics?.accuracy, 1)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-ink/35">{t("health.accuracy")}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(capabilities?.classes || []).slice(0, 10).map((item: any) => (
                <span key={item.class} className="rounded-full border border-ink/10 bg-sand/60 px-2 py-1 text-[9px] text-ink/50">
                  {t(`leaf.${item.class.replace(/[^a-zA-Z0-9]/g, "_")}`)}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="h-fit p-5">
            <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-leaf" />
            <h3 className="font-display text-xl tracking-tight">{t("health.register")}</h3>
          </div>
          <p className="mt-1 text-[11px] text-ink/45">{t("health.registerHint")}</p>
          <div className="mt-4 space-y-3">
            <Field label={t("health.parcel")}>
              <Select value={parcelId} onChange={(event) => setParcelId(event.target.value)}>
                {parcels.map((parcel) => <option key={parcel.id} value={parcel.id}>{parcel.name} · {parcel.farm_name}</option>)}
                {!parcels.length && <option value="">—</option>}
              </Select>
            </Field>
            <Field label={t("health.symptoms")}>
              <Textarea
                value={observation.symptoms}
                onChange={(event) => setObservation({ ...observation, symptoms: event.target.value })}
                placeholder={t("health.symptomsPlaceholder")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("health.severity")}>
                <Select value={observation.severity} onChange={(event) => setObservation({ ...observation, severity: event.target.value })}>
                  <option value="baja">{t("level.baja")}</option><option value="media">{t("level.media")}</option><option value="alta">{t("level.alta")}</option>
                </Select>
              </Field>
              <Field label={t("health.date")}>
                <Input type="date" value={observation.observed_at} onChange={(event) => setObservation({ ...observation, observed_at: event.target.value })} />
              </Field>
            </div>
            <Button className="w-full" onClick={addObservation} disabled={!observation.symptoms.trim() || !parcels.length}>
              {t("health.saveObs")}
            </Button>
          </div>
        </Card>

        <div className="space-y-2">
          {observations.map((item: any) => (
            <Card key={item.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-[12px] font-medium">{item.symptoms}</p>
                <p className="mt-1 text-[10px] text-ink/40">
                  {fecha(item.observed_at)} · severidad {item.severity} · parcela #{item.parcel_id}
                </p>
                {item.notes && <p className="mt-1 text-[10px] text-ink/40">{item.notes}</p>}
              </div>
              <button onClick={() => removeObservation(item.id)} className="text-ink/25 hover:text-clay">
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
          {!observations.length && (
            <EmptyState
              icon={<CheckCircle2 size={20} />}
              title={t("health.noObs")}
              description={t("health.noObsText")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
