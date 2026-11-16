import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  CloudRain,
  Download,
  Droplets,
  FileText,
  FlaskConical,
  Layers,
  Leaf,
  MapPin,
  Mountain,
  Pencil,
  Plus,
  RefreshCw,
  Satellite,
  Stethoscope,
  ThermometerSun,
  Trash2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, downloadFile } from "../lib/api";
import { fecha, ha, mes, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import AuthedImage from "../components/AuthedImage";
import MapPicker from "../components/MapPicker";
import ParcelScene from "../components/ParcelScene";
import SimulatorPanel from "../components/SimulatorPanel";
import {
  Badge,
  Button,
  Card,
  DataTag,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Tabs,
  Textarea,
} from "../components/ui";

const TABS = [
  { id: "resumen", key: "parcel.tab.summary" },
  { id: "suelo", key: "parcel.tab.soil" },
  { id: "clima", key: "parcel.tab.climate" },
  { id: "satelite", key: "parcel.tab.satellite" },
  { id: "simulador", key: "parcel.tab.simulator" },
  { id: "campanas", key: "parcel.tab.campaigns" },
  { id: "sanidad", key: "parcel.tab.health" },
];

const STATUS_LABEL: Record<string, string> = {
  planificada: "Planificada",
  en_curso: "En curso",
  cosechada: "Cosechada",
  cancelada: "Cancelada",
};

const EVENT_TYPES = [
  ["siembra", "Siembra"],
  ["riego", "Riego"],
  ["fertilizacion", "Fertilización"],
  ["labor", "Labor"],
  ["observacion", "Observación"],
  ["sanidad", "Sanidad"],
  ["cosecha", "Cosecha"],
];

export default function ParcelDetail() {
  const { id } = useParams();
  const parcelId = Number(id);
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("resumen");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [message, setMessage] = useState("");

  const { data: parcel, isLoading } = useQuery<any>({
    queryKey: ["parcel", String(parcelId)],
    queryFn: () => api(`/parcels/${parcelId}`),
    enabled: Boolean(parcelId),
  });

  const { data: climate, isLoading: climateLoading } = useQuery<any>({
    queryKey: ["climate", parcelId],
    queryFn: () => api(`/parcels/${parcelId}/climate`),
    enabled: Boolean(parcelId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: crops = [] } = useQuery<any[]>({
    queryKey: ["crops", "all"],
    queryFn: () => api("/crops?limit=200"),
  });

  const { data: observations = [] } = useQuery<any[]>({
    queryKey: ["observations", parcelId],
    queryFn: () => api(`/health/observations?parcel_id=${parcelId}`),
    enabled: Boolean(parcelId),
  });

  const [soilForm, setSoilForm] = useState({
    ph: "", texture: "franco", organic_matter_pct: "", ec_ds_m: "",
    lab_name: "", sample_date: new Date().toISOString().slice(0, 10), source_type: "declarado",
  });
  const [soilBusy, setSoilBusy] = useState(false);

  const [historyForm, setHistoryForm] = useState({ crop_id: "", year: String(new Date().getFullYear() - 1) });
  const [campaignForm, setCampaignForm] = useState({ crop_id: "", planned_sowing: new Date().toISOString().slice(0, 10) });
  const [eventFor, setEventFor] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    event_type: "riego", event_date: new Date().toISOString().slice(0, 10), description: "",
  });
  const [dateSat, setDateSat] = useState(new Date().toISOString().slice(0, 10));
  const [layer, setLayer] = useState("truecolor");

  const chartData = useMemo(() => {
    if (!climate?.rain_monthly_mm) return [];
    const monthly = climate.rain_monthly_mm;
    return Array.from({ length: 12 }, (_, index) => ({
      month: mes(index + 1),
      mm: monthly[index + 1] ?? monthly[String(index + 1)] ?? 0,
    }));
  }, [climate]);

  if (isLoading) return <Spinner label="Cargando parcela…" />;
  if (!parcel) return <EmptyState title="Parcela no encontrada" />;

  const latestSoil = parcel.soil?.[0];
  const refreshParcel = () => queryClient.invalidateQueries({ queryKey: ["parcel", String(parcelId)] });

  const saveSoil = async () => {
    setSoilBusy(true);
    setMessage("");
    try {
      await api(`/parcels/${parcelId}/soil`, {
        method: "POST",
        body: JSON.stringify({
          ...soilForm,
          ph: soilForm.ph || null,
          organic_matter_pct: soilForm.organic_matter_pct || null,
          ec_ds_m: soilForm.ec_ds_m || null,
          lab_name: soilForm.lab_name || null,
        }),
      });
      refreshParcel();
      setSoilForm({ ...soilForm, ph: "", organic_matter_pct: "", ec_ds_m: "", lab_name: "" });
      setMessage("Análisis de suelo registrado.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSoilBusy(false);
    }
  };

  const deleteSoil = async (analysisId: number) => {
    if (!window.confirm("¿Eliminar este análisis de suelo?")) return;
    await api(`/parcels/${parcelId}/soil/${analysisId}`, { method: "DELETE" });
    refreshParcel();
  };

  const addHistory = async () => {
    if (!historyForm.crop_id) return;
    try {
      await api(`/parcels/${parcelId}/history`, {
        method: "POST",
        body: JSON.stringify({ crop_id: Number(historyForm.crop_id), year: Number(historyForm.year) }),
      });
      refreshParcel();
      setHistoryForm({ crop_id: "", year: historyForm.year });
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const removeHistory = async (historyId: number) => {
    await api(`/parcels/${parcelId}/history/${historyId}`, { method: "DELETE" });
    refreshParcel();
  };

  const createCampaign = async () => {
    if (!campaignForm.crop_id) return;
    try {
      await api(`/parcels/${parcelId}/campaigns`, {
        method: "POST",
        body: JSON.stringify({ crop_id: Number(campaignForm.crop_id), planned_sowing: campaignForm.planned_sowing }),
      });
      refreshParcel();
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setMessage("Campaña creada.");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const confirmSowing = async (campaign: any) => {
    await api(`/campaigns/${campaign.id}`, {
      method: "PATCH",
      body: JSON.stringify({ actual_sowing: new Date().toISOString().slice(0, 10) }),
    });
    refreshParcel();
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  const addEvent = async () => {
    if (!eventFor || !eventForm.description) return;
    try {
      await api(`/campaigns/${eventFor.id}/events`, {
        method: "POST",
        body: JSON.stringify(eventForm),
      });
      refreshParcel();
      setEventFor(null);
      setEventForm({ ...eventForm, description: "" });
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const saveParcel = async () => {
    try {
      await api(`/parcels/${parcelId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          elevation_m: editForm.elevation_m || null,
          slope_pct: editForm.slope_pct || null,
          water_available: editForm.water_available,
          irrigation_type: editForm.irrigation_type,
          notes: editForm.notes,
        }),
      });
      setEditOpen(false);
      refreshParcel();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const deleteParcel = async () => {
    if (!window.confirm(`¿Eliminar “${parcel.name}” y todos sus datos asociados?`)) return;
    await api(`/parcels/${parcelId}`, { method: "DELETE" });
    navigate("/app/parcelas");
  };

  const refreshClimate = async () => {
    const data = await api(`/parcels/${parcelId}/climate?force=1`);
    queryClient.setQueryData(["climate", parcelId], data);
  };

  return (
    <div>
      <Link to="/app/parcelas" className="mb-4 inline-flex items-center gap-2 text-xs text-ink/45 hover:text-ink">
        <ArrowLeft size={14} /> {t("parcel.backToParcels")}
      </Link>

      <PageHeader
        eyebrow={parcel.farm_name || "ROOTWISE LAND"}
        title={parcel.name}
        description={`${ha(parcel.area_ha)} · ${parcel.centroid_lat?.toFixed(5)}, ${parcel.centroid_lon?.toFixed(5)} · ${t("parcel.workingPolygon")}`}
        actions={
          <>
            <Button variant="outline" onClick={() => downloadFile(`/parcels/${parcelId}/report.pdf`, `rootwise-${parcel.name}.pdf`)}>
              <Download size={14} /> {t("parcel.pdf")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditForm({
                  name: parcel.name,
                  elevation_m: parcel.elevation_m ?? "",
                  slope_pct: parcel.slope_pct ?? "",
                  water_available: parcel.water_available || "media",
                  irrigation_type: parcel.irrigation_type || "gravedad",
                  notes: parcel.notes || "",
                });
                setEditOpen(true);
              }}
            >
              <Pencil size={14} /> {t("parcel.edit")}
            </Button>
            <Button variant="danger" onClick={deleteParcel}>
              <Trash2 size={14} />
            </Button>
          </>
        }
      />

      {message && (
        <div className="mb-4 rounded-xl border border-leaf/25 bg-lime/15 px-3.5 py-2.5 text-xs text-ink/70">
          {message}
        </div>
      )}

      <Tabs tabs={TABS.map((tab) => ({ id: tab.id, label: t(tab.key) }))} active={tab} onChange={setTab} />

      <div className="mt-5">
        {tab === "resumen" && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <Card className="relative h-[430px] overflow-hidden p-0">
                <ParcelScene geometry={parcel.geometry} className="absolute inset-0 h-full w-full" />
              </Card>
              <div className="space-y-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <DataTag>{t("parcel.sheet")}</DataTag>
                    <MapPin size={15} className="text-leaf/60" />
                  </div>
                  <dl className="mt-4 space-y-2.5 text-[12px]">
                    {[
                      [t("parcel.farm"), parcel.farm_name || "—"],
                      [t("parcel.area"), ha(parcel.area_ha)],
                      [t("parcel.centroid"), `${parcel.centroid_lat?.toFixed(5)}, ${parcel.centroid_lon?.toFixed(5)}`],
                      [t("parcel.altitude"), parcel.elevation_m ? `${parcel.elevation_m} m` : t("parcel.noData")],
                      [t("parcel.slope"), parcel.slope_pct != null ? `${parcel.slope_pct}%` : t("parcel.noData")],
                      [t("parcel.water"), parcel.water_available ? t(`level.${parcel.water_available}`) : "—"],
                      [t("parcel.irrigation"), parcel.irrigation_type || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-3 border-b border-ink/6 pb-2 last:border-0 last:pb-0">
                        <dt className="text-ink/40">{label}</dt>
                        <dd className="text-right font-medium capitalize">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {parcel.notes && <p className="mt-3 text-[11px] leading-relaxed text-ink/45">{parcel.notes}</p>}
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <DataTag>{t("parcel.soilLatest")}</DataTag>
                    <Droplets size={15} className="text-leaf/60" />
                  </div>
                  {latestSoil ? (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-sand/60 p-2.5">
                        <p className="font-display text-lg leading-none">{latestSoil.ph ?? "—"}</p>
                        <p className="text-[9px] uppercase tracking-wider text-ink/35">pH</p>
                      </div>
                      <div className="rounded-xl bg-sand/60 p-2.5">
                        <p className="font-display text-lg leading-none capitalize">{latestSoil.texture || "—"}</p>
                        <p className="text-[9px] uppercase tracking-wider text-ink/35">{t("parcel.texture")}</p>
                      </div>
                      <div className="rounded-xl bg-sand/60 p-2.5">
                        <p className="font-display text-lg leading-none">{latestSoil.organic_matter_pct ?? "—"}%</p>
                        <p className="text-[9px] uppercase tracking-wider text-ink/35">MO</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-ink/45">{t("parcel.noSoil")}</p>
                  )}
                  <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setTab("suelo")}>
                    {t("parcel.manageSoil")}
                  </Button>
                </Card>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl tracking-tight">{t("parcel.history")}</h3>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-ink/35">{t("parcel.historyHint")}</p>
                  </div>
                  <Leaf size={16} className="text-leaf/60" />
                </div>
                <div className="mt-4 space-y-2">
                  {(parcel.crop_history || []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-ink/8 bg-white/60 px-3 py-2">
                      <div>
                        <p className="text-[12px] font-medium">{item.crop_name}</p>
                        <p className="text-[9px] uppercase tracking-wider text-ink/35">{item.family} · {item.year}</p>
                      </div>
                      <button
                        onClick={() => removeHistory(item.id)}
                        className="text-ink/25 transition hover:text-clay"
                        aria-label="Eliminar historial"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {!parcel.crop_history?.length && (
                    <p className="text-[11px] text-ink/40">Sin historial. Agrega el cultivo anterior para evaluar rotación.</p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Select
                    value={historyForm.crop_id}
                    onChange={(event) => setHistoryForm({ ...historyForm, crop_id: event.target.value })}
                    className="text-xs"
                  >
                    <option value="">Cultivo anterior</option>
                    {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
                  </Select>
                  <Input
                    type="number"
                    className="w-24 text-xs"
                    value={historyForm.year}
                    onChange={(event) => setHistoryForm({ ...historyForm, year: event.target.value })}
                  />
                  <Button size="sm" onClick={addHistory} disabled={!historyForm.crop_id}>
                    <Plus size={13} />
                  </Button>
                </div>
              </Card>

              <Card className="relative overflow-hidden p-0">
                <div className="p-5">
                  <DataTag>{t("parcel.lastRec")}</DataTag>
                  {parcel.simulations?.[0]?.results?.length ? (
                    <>
                      <p className="mt-3 font-display text-xl leading-tight">
                        {parcel.simulations[0].results[0].crop_name}
                      </p>
                      <p className="mt-1 text-[11px] text-ink/45">
                        {fecha(parcel.simulations[0].sowing_date)} · {parcel.simulations[0].results.length} cultivos evaluados
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-[12px] text-ink/45">
                      {t("parcel.noSim")}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("simulador")}>
                    <FlaskConical size={13} /> {t("parcel.openSim")}
                  </Button>
                </div>
                <div className="relative h-32 border-t border-ink/10">
                  <AuthedImage
                    path={`/nasa/parcels/${parcelId}/satellite?size=600`}
                    alt="Satélite de la parcela"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "suelo" && (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="h-fit p-5">
              <h3 className="font-display text-xl tracking-tight">Registrar análisis</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
                Diferencia siempre dato medido, de campo o declarado. El motor lo usa con esa procedencia.
              </p>
              <div className="mt-4 space-y-3">
                <Field label="Procedencia">
                  <Select value={soilForm.source_type} onChange={(event) => setSoilForm({ ...soilForm, source_type: event.target.value })}>
                    <option value="laboratorio">Laboratorio</option>
                    <option value="campo">Prueba de campo</option>
                    <option value="declarado">Declarado por el productor</option>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="pH"><Input type="number" step="0.1" min={0} max={14} value={soilForm.ph} onChange={(event) => setSoilForm({ ...soilForm, ph: event.target.value })} /></Field>
                  <Field label="Textura">
                    <Select value={soilForm.texture} onChange={(event) => setSoilForm({ ...soilForm, texture: event.target.value })}>
                      {["franco", "franco arenoso", "franco arcilloso", "arcilloso", "arenoso", "limoso"].map((texture) => (
                        <option key={texture} value={texture}>{texture}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Materia orgánica (%)"><Input type="number" step="0.1" value={soilForm.organic_matter_pct} onChange={(event) => setSoilForm({ ...soilForm, organic_matter_pct: event.target.value })} /></Field>
                  <Field label="Conductividad (dS/m)"><Input type="number" step="0.01" value={soilForm.ec_ds_m} onChange={(event) => setSoilForm({ ...soilForm, ec_ds_m: event.target.value })} /></Field>
                </div>
                <Field label="Laboratorio" hint="opcional"><Input value={soilForm.lab_name} onChange={(event) => setSoilForm({ ...soilForm, lab_name: event.target.value })} /></Field>
                <Field label="Fecha de muestra"><Input type="date" value={soilForm.sample_date} onChange={(event) => setSoilForm({ ...soilForm, sample_date: event.target.value })} /></Field>
                <Button className="w-full" onClick={saveSoil} loading={soilBusy}>Guardar análisis</Button>
              </div>
            </Card>

            <div className="space-y-3">
              {(parcel.soil || []).map((analysis: any) => (
                <Card key={analysis.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge tone="bg-sand border-ink/10 text-ink/60 capitalize">{analysis.source_type}</Badge>
                      <p className="mt-2 text-[11px] text-ink/40">
                        {analysis.sample_date ? fecha(analysis.sample_date) : "sin fecha"} · {analysis.lab_name || "sin laboratorio"}
                      </p>
                    </div>
                    <button onClick={() => deleteSoil(analysis.id)} className="text-ink/25 hover:text-clay">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
                    {[
                      ["pH", analysis.ph],
                      ["MO %", analysis.organic_matter_pct],
                      ["CE", analysis.ec_ds_m],
                      ["N ppm", analysis.n_ppm],
                      ["P ppm", analysis.p_ppm],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl bg-sand/50 p-2">
                        <p className="font-display text-lg leading-none">{value ?? "—"}</p>
                        <p className="text-[8px] uppercase tracking-wider text-ink/35">{label}</p>
                      </div>
                    ))}
                  </div>
                  {analysis.texture && <p className="mt-2 text-[11px] capitalize text-ink/45">Textura: {analysis.texture}</p>}
                </Card>
              ))}
              {!parcel.soil?.length && <EmptyState title="Sin análisis todavía" description="Registra pH y textura para que las recomendaciones ganen confianza." />}
            </div>
          </div>
        )}

        {tab === "clima" && (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <DataTag>NASA POWER · comunidad AG</DataTag>
                  <h3 className="mt-2 font-display text-2xl tracking-tight">Clima observado</h3>
                  <p className="mt-1 text-[11px] text-ink/45">
                    {climate?.period?.start} → {climate?.period?.end} · resolución {climate?.meta?.resolution_deg}°
                    · {climate?.meta?.resolution_note}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshClimate} loading={climateLoading}>
                  <RefreshCw size={13} /> Actualizar
                </Button>
              </div>

              {!climate?.available ? (
                <p className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-xs text-[#6b4d12]">
                  {climate?.reason || "Sin datos disponibles."}
                </p>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Temp. media", value: `${climate.t2m_mean} °C`, icon: ThermometerSun },
                      { label: "Lluvia anual", value: `${Math.round(climate.rain_annual_mm)} mm`, icon: CloudRain },
                      { label: "Mín. histórica", value: `${climate.tmin_abs} °C`, icon: Mountain },
                      { label: "Humedad", value: `${climate.rh_mean ?? "—"} %`, icon: Droplets },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-ink/8 bg-sand/50 p-3.5">
                        <item.icon size={15} className="text-leaf/60" />
                        <p className="mt-2 font-display text-xl leading-none">{item.value}</p>
                        <p className="mt-1 text-[9px] uppercase tracking-wider text-ink/35">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#0e2a2012" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7c71" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#6b7c71" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "1px solid #0e2a2015", fontSize: 11 }}
                          formatter={(value: any) => [`${Math.round(value)} mm`, "Lluvia mensual"]}
                        />
                        <Bar dataKey="mm" fill="#1F6A4A" radius={[4, 4, 0, 0]} maxBarSize={26} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-ink/35">
                    Promedio mensual de los últimos {climate.years} años. Los datos satelitales son
                    contexto regional; no sustituyen un pluviómetro en la parcela.
                  </p>
                </>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-leaf" />
                  <p className="text-xs font-medium">Mapa de referencia</p>
                </div>
                <Link to="/app/nasa" className="inline-flex items-center gap-1 text-[11px] font-medium text-leaf hover:underline">
                  Más datos NASA <Satellite size={12} />
                </Link>
              </div>
              <div className="mt-3">
                <MapPicker ring={parcel.geometry?.coordinates?.[0] || []} readOnly height="h-[300px]" center={[parcel.centroid_lat, parcel.centroid_lon]} zoom={15} />
              </div>
            </Card>
          </div>
        )}

        {tab === "satelite" && (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card className="overflow-hidden p-0">
              <AuthedImage
                path={`/nasa/parcels/${parcelId}/satellite?size=900&date=${dateSat}&layer=${layer}`}
                alt={`Imagen satelital de ${parcel.name}`}
                className="h-[430px] w-full object-cover"
                loadingLabel="Consultando Worldview…"
              />
              <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">NASA Worldview · {dateSat}</p>
                <Badge tone="bg-lime/25 border-lime/40 text-ink/70">imagen referencial</Badge>
              </div>
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-display text-2xl tracking-tight">Observa tu zona</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/50">
                  Cambia fecha y capa. Las imágenes se solicitan desde el backend para evitar
                  bloqueos de CORS y se cachean por una hora.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Fecha">
                    <Input type="date" value={dateSat} onChange={(event) => setDateSat(event.target.value)} />
                  </Field>
                  <Field label="Capa">
                    <Select value={layer} onChange={(event) => setLayer(event.target.value)}>
                      <option value="truecolor">MODIS TrueColor</option>
                      <option value="viirs">VIIRS TrueColor</option>
                      <option value="landsat">Landsat anual</option>
                    </Select>
                  </Field>
                </div>
              </Card>
              <Card className="p-5 text-[11px] leading-relaxed text-ink/45">
                <p className="font-medium text-ink/65">Qué estás viendo</p>
                <p className="mt-2">
                  Una composición de reflectancia de superficie de la zona, no una foto en vivo
                  ni una medición de tu parcela. La cobertura de nubes puede ocultar el terreno.
                </p>
                <Link to="/app/nasa" className="mt-3 inline-flex items-center gap-1.5 font-medium text-leaf hover:underline">
                  Catálogo CMR, GIBS y EPIC <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </Card>
            </div>
          </div>
        )}

        {tab === "simulador" && <SimulatorPanel parcelId={parcelId} onOpenCampaign={() => setTab("campanas")} />}

        {tab === "campanas" && (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {(parcel.campaigns || []).map((campaign: any) => (
                <Card key={campaign.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-ink/35">Campaña #{campaign.id}</p>
                      <h3 className="mt-1 font-display text-2xl leading-tight">{campaign.crop_name}</h3>
                      <p className="mt-1 text-[11px] text-ink/45">
                        Planificada {fecha(campaign.planned_sowing)}
                        {campaign.actual_sowing ? ` · sembrada ${fecha(campaign.actual_sowing)}` : " · siembra sin confirmar"}
                      </p>
                    </div>
                    <Badge
                      tone={
                        campaign.status === "en_curso"
                          ? "bg-lime/30 border-lime/50 text-ink"
                          : campaign.status === "cosechada"
                            ? "bg-leaf/15 border-leaf/30 text-leaf"
                            : "bg-sand border-ink/10 text-ink/55"
                      }
                    >
                      <Activity size={11} /> {STATUS_LABEL[campaign.status] || campaign.status}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
                    <div className="rounded-lg bg-sand/50 px-2.5 py-2">
                      <p className="text-ink/35">Ciclo</p>
                      <p className="font-medium">{campaign.cycle_days || "—"} días</p>
                    </div>
                    <div className="rounded-lg bg-sand/50 px-2.5 py-2">
                      <p className="text-ink/35">Cosecha objetivo</p>
                      <p className="font-medium">{fecha(campaign.target_harvest)}</p>
                    </div>
                    <div className="rounded-lg bg-sand/50 px-2.5 py-2">
                      <p className="text-ink/35">Eventos</p>
                      <p className="font-medium">{campaign.events?.length || 0}</p>
                    </div>
                  </div>

                  {(campaign.events || []).length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {campaign.events.map((event: any) => (
                        <div key={event.id} className="flex items-start gap-2 text-[11px] text-ink/55">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />
                          <span className="text-ink/40">{fecha(event.event_date)}</span>
                          <span className="font-medium capitalize">{event.event_type}:</span>
                          <span className="text-ink/45">{event.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!campaign.actual_sowing && (
                      <Button size="sm" onClick={() => confirmSowing(campaign)}>
                        Confirmar siembra real
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEventFor(campaign)}>
                      <Plus size={13} /> Registrar evento
                    </Button>
                  </div>
                </Card>
              ))}
              {!parcel.campaigns?.length && (
                <EmptyState title="Sin campañas" description="Convierte una recomendación en campaña o créala aquí a la derecha." />
              )}
            </div>

            <Card className="h-fit p-5">
              <div className="flex items-center gap-2">
                <CalendarPlus size={16} className="text-leaf" />
                <h3 className="font-display text-xl tracking-tight">Nueva campaña</h3>
              </div>
              <div className="mt-4 space-y-3">
                <Field label="Cultivo">
                  <Select value={campaignForm.crop_id} onChange={(event) => setCampaignForm({ ...campaignForm, crop_id: event.target.value })}>
                    <option value="">Selecciona cultivo</option>
                    {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
                  </Select>
                </Field>
                <Field label="Siembra planificada">
                  <Input type="date" value={campaignForm.planned_sowing} onChange={(event) => setCampaignForm({ ...campaignForm, planned_sowing: event.target.value })} />
                </Field>
                <Button className="w-full" onClick={createCampaign} disabled={!campaignForm.crop_id}>
                  Crear campaña
                </Button>
                <p className="text-[10px] leading-relaxed text-ink/35">
                  La fecha planificada no cuenta como siembra ejecutada. Confírmala cuando ocurra.
                </p>
              </div>
            </Card>
          </div>
        )}

        {tab === "sanidad" && (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="p-5">
              <Stethoscope size={20} className="text-leaf" />
              <h3 className="mt-3 font-display text-xl tracking-tight">Sanidad integrada</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/50">
                Sube una foto de hoja de tomate al módulo de sanidad para un triage orientativo,
                o registra síntomas observados. Prioriza prevención y manejo integrado.
              </p>
              <Link to="/app/sanidad">
                <Button className="mt-4" size="sm">Abrir módulo de sanidad</Button>
              </Link>
            </Card>
            <div className="space-y-2">
              {observations.map((observation: any) => (
                <Card key={observation.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-medium">{observation.symptoms}</p>
                      <p className="mt-1 text-[10px] text-ink/40">
                        {fecha(observation.observed_at)} · severidad {observation.severity}
                      </p>
                    </div>
                    <Badge tone="bg-sand border-ink/10 text-ink/55">{observation.severity}</Badge>
                  </div>
                </Card>
              ))}
              {!observations.length && <EmptyState title="Sin observaciones" description="Registra síntomas desde el módulo de sanidad." />}
            </div>
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar parcela">
        {editForm && (
          <div className="space-y-3">
            <Field label="Nombre"><Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Altitud (m)"><Input type="number" value={editForm.elevation_m} onChange={(event) => setEditForm({ ...editForm, elevation_m: event.target.value })} /></Field>
              <Field label="Pendiente (%)"><Input type="number" value={editForm.slope_pct} onChange={(event) => setEditForm({ ...editForm, slope_pct: event.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Agua">
                <Select value={editForm.water_available} onChange={(event) => setEditForm({ ...editForm, water_available: event.target.value })}>
                  <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
                </Select>
              </Field>
              <Field label="Riego">
                <Select value={editForm.irrigation_type} onChange={(event) => setEditForm({ ...editForm, irrigation_type: event.target.value })}>
                  {["gravedad", "goteo", "aspersion", "secano", "mixto"].map((type) => <option key={type} value={type}>{type}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Notas"><Textarea value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={saveParcel}>Guardar cambios</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(eventFor)} onClose={() => setEventFor(null)} title="Registrar evento">
        <div className="space-y-3">
          <p className="text-xs text-ink/50">
            Campaña de <strong>{eventFor?.crop_name}</strong>
          </p>
          <Field label="Tipo">
            <Select value={eventForm.event_type} onChange={(event) => setEventForm({ ...eventForm, event_type: event.target.value })}>
              {EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </Field>
          <Field label="Fecha"><Input type="date" value={eventForm.event_date} onChange={(event) => setEventForm({ ...eventForm, event_date: event.target.value })} /></Field>
          <Field label="Descripción"><Textarea value={eventForm.description} onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} placeholder="Riego por gravedad, 3 horas…" /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEventFor(null)}>Cancelar</Button>
            <Button onClick={addEvent} disabled={!eventForm.description}>Guardar evento</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
