import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Database,
  ExternalLink,
  Flame,
  Globe2,
  Layers,
  Loader2,
  Satellite,
  Search,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import AuthedImage from "../components/AuthedImage";
import { Badge, Button, Card, DataTag, EmptyState, Field, Input, PageHeader, Select, Spinner } from "../components/ui";

export default function Nasa() {
  const [parcelId, setParcelId] = useState("");
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [layer, setLayer] = useState("truecolor");
  const [keyword, setKeyword] = useState("soil moisture");
  const [collections, setCollections] = useState<any[] | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [epicBusy, setEpicBusy] = useState(false);
  const [epic, setEpic] = useState<any>(null);
  const [firms, setFirms] = useState<any>(null);
  const [firmsError, setFirmsError] = useState("");
  const [error, setError] = useState("");
  const { t } = useI18n();

  const { data: farms = [], isLoading } = useQuery<any[]>({
    queryKey: ["farms"],
    queryFn: () => api("/farms"),
  });

  const { data: status } = useQuery<any>({
    queryKey: ["nasa", "status"],
    queryFn: () => api("/nasa/status"),
  });

  const parcels = useMemo(
    () => farms.flatMap((farm) => (farm.parcels || []).map((parcel: any) => ({ ...parcel, farm_name: farm.name }))),
    [farms],
  );

  useEffect(() => {
    if (!parcelId && parcels.length) setParcelId(String(parcels[0].id));
  }, [parcels, parcelId]);

  const selected = parcels.find((parcel) => String(parcel.id) === parcelId) || parcels[0];

  const searchCollections = async () => {
    setSearchBusy(true);
    setError("");
    try {
      const data = await api(`/nasa/collections?keyword=${encodeURIComponent(keyword)}`);
      setCollections(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearchBusy(false);
    }
  };

  const loadEpic = async () => {
    setEpicBusy(true);
    setError("");
    try {
      setEpic(await api("/nasa/epic"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEpicBusy(false);
    }
  };

  const loadFirms = async () => {
    setFirmsError("");
    try {
      setFirms(await api("/nasa/firms?days=3"));
    } catch (err: any) {
      setFirmsError(err.message);
    }
  };

  if (isLoading) return <Spinner label="Preparando datos de la Tierra…" />;

  const satellitePath = selected
    ? `/nasa/parcels/${selected.id}/satellite?size=900&date=${day}&layer=${layer}`
    : `/nasa/satellite?lat=-9.19&lon=-75.015&size=900&date=${day}&layer=${layer}`;

  return (
    <div>
      <PageHeader
        eyebrow="ROOTWISE EARTH"
        title={t("earth.title")}
        description={t("earth.desc")}
        actions={<Badge tone="bg-lime/25 border-lime/40 text-ink/70"><Satellite size={12} /> {status?.endpoints?.filter((item: any) => item.enabled).length || 0} endpoints activos</Badge>}
      />

      {error && <p className="mb-4 rounded-xl border border-clay/25 bg-clay/8 px-3.5 py-2.5 text-[11px] text-clay">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden p-0">
          <AuthedImage
            path={satellitePath}
            alt="Imagen satelital Worldview"
            className="h-[460px] w-full object-cover"
            loadingLabel="Consultando Worldview…"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
              NASA Worldview Snapshots · {day} · {layer}
            </p>
            <a
              href="https://wvs.earthdata.nasa.gov/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-leaf hover:underline"
            >
              Abrir fuente <ExternalLink size={11} />
            </a>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-display text-xl tracking-tight">Vista de tu zona</h3>
            <div className="mt-3 space-y-3">
              <Field label="Parcela de referencia">
                <Select value={parcelId} onChange={(event) => setParcelId(event.target.value)}>
                  <option value="">Perú (vista general)</option>
                  {parcels.map((parcel) => <option key={parcel.id} value={parcel.id}>{parcel.name} · {parcel.farm_name}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha"><Input type="date" value={day} onChange={(event) => setDay(event.target.value)} /></Field>
                <Field label="Capa">
                  <Select value={layer} onChange={(event) => setLayer(event.target.value)}>
                    <option value="truecolor">MODIS TrueColor</option>
                    <option value="viirs">VIIRS TrueColor</option>
                    <option value="landsat">Landsat anual</option>
                  </Select>
                </Field>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-ink/35">
              Las nubes pueden cubrir la zona. La imagen es una composición del día solicitado,
              no una captura en vivo.
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Globe2 size={16} className="text-leaf" />
              <h3 className="font-display text-xl tracking-tight">La Tierra hoy</h3>
            </div>
            {epic ? (
              <div className="mt-3">
                <img src={epic.image_url} alt="Tierra desde DSCOVR" className="h-40 w-full rounded-xl object-cover" />
                <p className="mt-2 text-[10px] text-ink/40">{epic.caption}</p>
                <p className="text-[9px] uppercase tracking-wider text-ink/30">{epic.date} · EPIC / DSCOVR</p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-[11px] leading-relaxed text-ink/45">
                  Última imagen de la Tierra desde el punto L1, cortesía de NASA EPIC.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={loadEpic} loading={epicBusy}>
                  Cargar EPIC
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-leaf" />
            <h3 className="font-display text-xl tracking-tight">Catálogo CMR</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
            Busca colecciones de Earthdata por palabra clave: humedad del suelo, vegetación,
            precipitación, temperatura superficial.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="soil moisture"
              onKeyDown={(event) => event.key === "Enter" && searchCollections()}
            />
            <Button onClick={searchCollections} loading={searchBusy}>
              <Search size={14} />
            </Button>
          </div>

          <div className="thin-scroll mt-4 max-h-[330px] space-y-2 overflow-y-auto pr-1">
            {collections?.map((collection) => (
              <div key={collection.id} className="rounded-xl border border-ink/8 bg-white/60 p-3">
                <p className="text-[11px] font-medium leading-snug">{collection.title}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-ink/35">
                  {collection.short_name} · {collection.id}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-ink/45">{collection.summary}</p>
                {collection.links?.[0] && (
                  <a href={collection.links[0]} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-leaf hover:underline">
                    Ver colección <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
            ))}
            {!collections && <p className="py-6 text-center text-[11px] text-ink/35">Aún sin búsqueda.</p>}
            {collections?.length === 0 && <p className="py-6 text-center text-[11px] text-ink/35">Sin resultados.</p>}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-clay" />
              <h3 className="font-display text-xl tracking-tight">Incendios activos</h3>
              <Badge tone={status?.endpoints?.find((item: any) => item.id === "firms")?.enabled ? "bg-lime/25 border-lime/40 text-ink/70" : "bg-sand border-ink/10 text-ink/50"}>
                {status?.endpoints?.find((item: any) => item.id === "firms")?.enabled ? "MAP_KEY configurada" : "requiere MAP_KEY"}
              </Badge>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink/45">
              Detecciones VIIRS de los últimos 3 días para el ámbito del proyecto. Requiere una
              MAP_KEY gratuita de FIRMS configurada en el servidor.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadFirms}>
              Consultar FIRMS
            </Button>
            {firmsError && <p className="mt-2 text-[10px] text-clay">{firmsError}</p>}
            {firms && (
              <div className="mt-3 rounded-xl bg-sand/50 p-3 text-[11px] text-ink/55">
                <p className="font-medium text-ink/70">{firms.count} detecciones</p>
                <p className="mt-1 text-[10px]">Fuente: {firms.source}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-leaf" />
              <h3 className="font-display text-xl tracking-tight">Estado de integraciones</h3>
            </div>
            <div className="mt-3 space-y-2">
              {(status?.endpoints || []).map((endpoint: any) => (
                <div key={endpoint.id} className="flex items-start justify-between gap-3 border-b border-ink/6 pb-2 last:border-0">
                  <div>
                    <p className="text-[11px] font-medium">{endpoint.name}</p>
                    <p className="text-[9px] uppercase tracking-wider text-ink/35">{endpoint.use}</p>
                  </div>
                  <Badge tone={endpoint.enabled ? "bg-lime/20 border-lime/40 text-ink/70" : "bg-sand border-ink/10 text-ink/45"}>
                    {endpoint.auth}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-ink/30">
              <ShieldCheck size={11} /> proxy backend · sin claves en el navegador
            </p>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <DataTag>Atribución y límites</DataTag>
            <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-ink/45">
              Productos de NASA EOSDIS: POWER, GIBS, Worldview, CMR, EPIC y FIRMS. Cada capa
              conserva proveedor, producto, fecha, resolución y método. Los datos satelitales
              son contexto regional, no mediciones dentro de la parcela, y no se presentan como
              pronóstico determinista.
            </p>
          </div>
          <a href="https://www.earthdata.nasa.gov/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 px-3.5 py-2 text-[11px] font-medium text-ink/60 transition hover:bg-white">
            NASA Earthdata <ArrowUpRight size={12} />
          </a>
        </div>
      </Card>
    </div>
  );
}
