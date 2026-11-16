import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Map, Plus } from "lucide-react";
import { api } from "../lib/api";
import { ha } from "../lib/format";
import { useI18n } from "../lib/i18n";
import SimulatorPanel from "../components/SimulatorPanel";
import { Button, Card, EmptyState, PageHeader, Spinner } from "../components/ui";

export default function Simulator() {
  const [parcelId, setParcelId] = useState<number | null>(null);
  const { t } = useI18n();

  const { data: farms = [], isLoading } = useQuery<any[]>({
    queryKey: ["farms"],
    queryFn: () => api("/farms"),
  });

  const parcels = farms.flatMap((farm) =>
    (farm.parcels || []).map((parcel: any) => ({ ...parcel, farm_name: farm.name })),
  );

  useEffect(() => {
    if (!parcelId && parcels.length) setParcelId(parcels[0].id);
  }, [parcels, parcelId]);

  if (isLoading) return <Spinner label="Cargando parcelas…" />;

  if (!parcels.length) {
    return (
      <div>
        <PageHeader eyebrow="ROOTWISE ROTATION" title={t("sim.title")} description={t("sim.desc")} />
        <EmptyState
          icon={<Map size={22} />}
          title={t("dash.noParcels")}
          description={t("dash.noParcelsText")}
          action={<Link to="/app/parcelas/nueva"><Button><Plus size={14} /> {t("dash.createParcel")}</Button></Link>}
        />
      </div>
    );
  }

  const selected = parcels.find((parcel) => parcel.id === parcelId);

  return (
    <div>
      <PageHeader
        eyebrow="ROOTWISE ROTATION"
        title={t("sim.title")}
        description={t("sim.desc")}
        actions={
          <Link to="/app/parcelas">
            <Button variant="outline">{t("sim.manage")} <ArrowRight size={14} /></Button>
          </Link>
        }
      />

      <Card className="mb-4 p-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {parcels.map((parcel) => (
            <button
              key={parcel.id}
              onClick={() => setParcelId(parcel.id)}
              className={`whitespace-nowrap rounded-xl border px-3.5 py-2 text-left transition ${
                parcelId === parcel.id
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/10 bg-white/60 text-ink/65 hover:border-ink/25"
              }`}
            >
              <span className="block text-[12px] font-medium">{parcel.name}</span>
              <span className={`block text-[9px] uppercase tracking-wider ${parcelId === parcel.id ? "text-cream/50" : "text-ink/35"}`}>
                {parcel.farm_name} · {ha(parcel.area_ha)}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {selected && (
        <p className="mb-3 text-[11px] text-ink/40">
          {t("sim.evaluating", {
            name: selected.name,
            altitude: selected.elevation_m ? `${selected.elevation_m} m` : t("sim.noAltitude"),
            water: t(`level.${selected.water_available || "media"}`),
          })}
        </p>
      )}

      {parcelId && <SimulatorPanel parcelId={parcelId} />}
    </div>
  );
}
