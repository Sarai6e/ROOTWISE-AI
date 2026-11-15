import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, Sprout } from "lucide-react";
import { api } from "../lib/api";
import { fecha } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { Badge, Card, EmptyState, PageHeader, Select, Spinner } from "../components/ui";

const STATUS: Record<string, { label: string; tone: string }> = {
  planificada: { label: "Planificada", tone: "bg-sand border-ink/10 text-ink/55" },
  en_curso: { label: "En curso", tone: "bg-lime/30 border-lime/50 text-ink" },
  cosechada: { label: "Cosechada", tone: "bg-leaf/15 border-leaf/30 text-leaf" },
  cancelada: { label: "Cancelada", tone: "bg-clay/10 border-clay/25 text-clay" },
};

export default function Campaigns() {
  const [status, setStatus] = useState("todas");
  const { t } = useI18n();

  const { data: campaigns = [], isLoading } = useQuery<any[]>({
    queryKey: ["campaigns"],
    queryFn: () => api("/campaigns"),
  });

  const filtered = useMemo(
    () => (status === "todas" ? campaigns : campaigns.filter((campaign) => campaign.status === status)),
    [campaigns, status],
  );

  const counts = useMemo(
    () => ({
      en_curso: campaigns.filter((campaign) => campaign.status === "en_curso").length,
      planificada: campaigns.filter((campaign) => campaign.status === "planificada").length,
      cosechada: campaigns.filter((campaign) => campaign.status === "cosechada").length,
    }),
    [campaigns],
  );

  if (isLoading) return <Spinner label="Cargando campañas…" />;

  return (
    <div>
      <PageHeader
        eyebrow="ROOTWISE PLANT"
        title={t("campaigns.title")}
        description={t("campaigns.desc")}
        actions={
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto text-xs">
            <option value="todas">{t("campaigns.all")} ({campaigns.length})</option>
            <option value="planificada">{t("campaigns.planned")} ({counts.planificada})</option>
            <option value="en_curso">{t("campaigns.active")} ({counts.en_curso})</option>
            <option value="cosechada">{t("campaigns.harvested")} ({counts.cosechada})</option>
          </Select>
        }
      />

      {!campaigns.length ? (
        <EmptyState
          icon={<CalendarDays size={22} />}
          title={t("campaigns.empty")}
          description={t("campaigns.emptyText")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((campaign) => {
            const meta = STATUS[campaign.status] || STATUS.planificada;
            return (
              <Card key={campaign.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink/35">
                      {campaign.parcel_name} · #{campaign.id}
                    </p>
                    <h3 className="mt-1 font-display text-2xl leading-tight tracking-tight">{campaign.crop_name}</h3>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-xl bg-sand/50 p-2.5">
                    <p className="text-ink/35">Planificada</p>
                    <p className="mt-0.5 font-medium">{fecha(campaign.planned_sowing)}</p>
                  </div>
                  <div className="rounded-xl bg-sand/50 p-2.5">
                    <p className="text-ink/35">Cosecha</p>
                    <p className="mt-0.5 font-medium">{fecha(campaign.target_harvest)}</p>
                  </div>
                  <div className="rounded-xl bg-sand/50 p-2.5">
                    <p className="text-ink/35">Ciclo</p>
                    <p className="mt-0.5 font-medium">{campaign.cycle_days || "—"} d</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-ink/45">
                    <Sprout size={12} className="text-leaf" /> {campaign.crop_family}
                  </span>
                  <Link
                    to={`/app/parcelas/${campaign.parcel_id}`}
                    className="inline-flex items-center gap-1 font-medium text-leaf hover:underline"
                  >
                    Abrir parcela <ArrowUpRight size={12} />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
