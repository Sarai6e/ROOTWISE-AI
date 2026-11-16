import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CloudRain,
  Droplets,
  FlaskConical,
  Leaf,
  Map,
  Plus,
  Satellite,
  Sprout,
  ThermometerSun,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSimulationExplanation } from "../lib/explain";
import { useI18n } from "../lib/i18n";
import { classificationMeta, fechaHora, ha, pct } from "../lib/format";
import AuthedImage from "../components/AuthedImage";
import { Badge, Button, Card, DataTag, EmptyState, PageHeader, ScoreBar, Spinner, Stat } from "../components/ui";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const explain = useSimulationExplanation();

  const { data: farms = [], isLoading } = useQuery<any[]>({
    queryKey: ["farms"],
    queryFn: () => api("/farms"),
  });
  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["campaigns"],
    queryFn: () => api("/campaigns"),
  });
  const { data: simulations = [] } = useQuery<any[]>({
    queryKey: ["simulations"],
    queryFn: () => api("/simulations"),
  });

  const parcels = farms.flatMap((farm) => (farm.parcels || []).map((parcel: any) => ({ ...parcel, farm_name: farm.name })));
  const firstParcel = parcels[0];
  const hectares = parcels.reduce((total, parcel) => total + (parcel.area_ha || 0), 0);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "en_curso").length;

  const { data: climate, isLoading: climateLoading } = useQuery<any>({
    queryKey: ["climate", firstParcel?.id],
    queryFn: () => api(`/parcels/${firstParcel.id}/climate`),
    enabled: Boolean(firstParcel?.id),
    staleTime: 10 * 60 * 1000,
  });

  const latestRun = simulations[0];
  const bestResult = latestRun?.results?.slice().sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];

  if (isLoading) return <Spinner label="Cargando tu panel…" />;

  return (
    <div>
      <PageHeader
        eyebrow={t("dash.greeting", { name: user?.full_name?.split(" ")[0] || "" })}
        title={t("dash.title")}
        description={t("dash.desc")}
        actions={
          <Link to="/app/parcelas/nueva">
            <Button>
              <Plus size={15} /> {t("dash.newParcel")}
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("dash.parcels")} value={parcels.length} hint={t("dash.parcelHint", { count: farms.length })} icon={<Map size={16} />} />
        <Stat label={t("dash.hectares")} value={ha(hectares)} hint={t("dash.hectaresHint")} icon={<Leaf size={16} />} />
        <Stat label={t("dash.campaigns")} value={activeCampaigns} hint={t("dash.campaignsHint", { count: campaigns.length })} icon={<CalendarDays size={16} />} />
        <Stat label={t("dash.simulations")} value={simulations.length} hint={t("dash.simulationsHint")} icon={<FlaskConical size={16} />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="relative overflow-hidden p-0">
          <div className="grid gap-0 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <DataTag>{t("dash.climate")}</DataTag>
                <CloudRain size={18} className="text-leaf/60" />
              </div>
              {!firstParcel ? (
                <p className="mt-6 text-sm text-ink/55">{t("dash.noParcel")}</p>
              ) : climateLoading ? (
                <Spinner label={t("common.loading")} />
              ) : climate?.available ? (
                <>
                  <p className="mt-5 font-display text-4xl leading-none tracking-tight">
                    {climate.t2m_mean?.toFixed(1)}°C
                  </p>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">
                    {t("dash.temp")} · {firstParcel.name}
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { label: t("dash.rain"), value: `${Math.round(climate.rain_annual_mm || 0)} mm`, icon: Droplets },
                      { label: t("dash.min"), value: `${climate.tmin_abs?.toFixed(1)}°C`, icon: ThermometerSun },
                      { label: t("dash.humidity"), value: `${climate.rh_mean ?? "—"}%`, icon: CloudRain },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-ink/8 bg-sand/50 p-2.5">
                        <item.icon size={13} className="text-leaf/70" />
                        <p className="mt-1.5 text-sm font-semibold">{item.value}</p>
                        <p className="text-[9px] uppercase tracking-wider text-ink/40">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] leading-relaxed text-ink/35">
                    Periodo {climate.period?.start} → {climate.period?.end} · resolución{" "}
                    {climate.meta?.resolution_deg}° · contexto regional, no medición parcelaria.
                  </p>
                </>
              ) : (
                <p className="mt-6 text-sm text-ink/50">
                  NASA POWER no respondió. La app sigue funcionando con los datos guardados.
                </p>
              )}
            </div>
            <div className="relative min-h-[190px] border-t border-ink/10 sm:border-l sm:border-t-0">
              {firstParcel ? (
                <AuthedImage
                  path={`/nasa/parcels/${firstParcel.id}/satellite?size=640`}
                  alt={`Imagen satelital de ${firstParcel.name}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  loadingLabel="Worldview…"
                />
              ) : (
                <div className="absolute inset-0 bg-sand" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-cream/60">
                  NASA Worldview · imagen referencial
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Badge tone="bg-ink text-lime border-ink">{t("dash.lastSim")}</Badge>
            <Link to="/app/simulador" className="text-ink/35 transition hover:text-ink">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          {bestResult ? (
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
                {latestRun.parcel_name} · {fechaHora(latestRun.created_at)}
              </p>
              <h4 className="mt-2 font-display text-2xl leading-tight">{bestResult.crop_name}</h4>
              <div className="mt-3">
                <Badge tone={classificationMeta(bestResult.classification).tone}>
                  {t(`class.${bestResult.classification}`)}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-ink/45">
                <span>{t("sim.aptitude")}</span>
                <span className="font-semibold text-ink">{pct(bestResult.score)}</span>
              </div>
              <div className="mt-2"><ScoreBar value={bestResult.score} /></div>
              <p className="mt-4 line-clamp-4 text-[11px] leading-relaxed text-ink/45">
                {explain(bestResult)}
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm text-ink/50">{t("dash.noSim")}</p>
              <Link to="/app/simulador">
                <Button variant="outline" size="sm" className="mt-4">
                  {t("dash.openSim")} <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl tracking-tight">{t("dash.myParcels")}</h2>
              <p className="mt-1 text-xs text-ink/45">{t("dash.myParcelsDesc")}</p>
            </div>
            <Link to="/app/parcelas" className="text-xs font-medium text-leaf hover:underline">
              {t("common.seeAll")}
            </Link>
          </div>

          <div className="mt-5 space-y-2.5">
            {parcels.slice(0, 3).map((parcel) => (
              <Link
                key={parcel.id}
                to={`/app/parcelas/${parcel.id}`}
                className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-white/60 p-3 transition hover:border-leaf/30 hover:bg-white"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime/30 text-leaf">
                  <Sprout size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{parcel.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink/40">
                    {parcel.farm_name} · {ha(parcel.area_ha)}
                  </p>
                </div>
                <ArrowRight size={14} className="text-ink/30" />
              </Link>
            ))}
            {!parcels.length && (
              <EmptyState
                icon={<Map size={20} />}
                title={t("dash.noParcels")}
                description={t("dash.noParcelsText")}
                action={
                  <Link to="/app/parcelas/nueva">
                    <Button size="sm"><Plus size={13} /> {t("dash.createParcel")}</Button>
                  </Link>
                }
              />
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="grid h-full sm:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6">
              <Badge tone="bg-sand border-ink/10 text-ink/60">
                <Satellite size={12} /> {t("nav.earth")}
              </Badge>
              <h2 className="mt-4 font-display text-2xl leading-tight tracking-tight">
                {t("dash.earthTitle")}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink/50">
                {t("dash.earthText")}
              </p>
              <Link to="/app/nasa">
                <Button variant="outline" size="sm" className="mt-4">
                  {t("dash.exploreEarth")} <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
            <div className="relative min-h-[150px] bg-ink">
              {firstParcel ? (
                <AuthedImage
                  path={`/nasa/parcels/${firstParcel.id}/satellite?size=520`}
                  alt="Vista satelital de la zona"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 mesh-dark" />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
