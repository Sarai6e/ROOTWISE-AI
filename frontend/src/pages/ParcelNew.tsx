import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Compass, Info, MapPin } from "lucide-react";
import { api } from "../lib/api";
import MapPicker from "../components/MapPicker";
import { Button, Card, DataTag, Field, Input, PageHeader, Select, Spinner, Textarea } from "../components/ui";

function areaHa(ring: number[][]) {
  if (ring.length < 4) return 0;
  const points = ring.slice(0, -1);
  const lat0 = (points.reduce((sum, point) => sum + point[1], 0) / points.length) * (Math.PI / 180);
  let total = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lon1, lat1] = ring[index];
    const [lon2, lat2] = ring[index + 1];
    const x1 = lon1 * (Math.PI / 180) * Math.cos(lat0);
    const y1 = lat1 * (Math.PI / 180);
    const x2 = lon2 * (Math.PI / 180) * Math.cos(lat0);
    const y2 = lat2 * (Math.PI / 180);
    total += x1 * y2 - x2 * y1;
  }
  return Math.abs(total) * 6371008.8 * 6371008.8 / 2 / 10000;
}

export default function ParcelNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [ring, setRing] = useState<number[][]>([]);
  const [form, setForm] = useState({
    farm_id: params.get("farm") || "",
    name: "",
    elevation_m: "",
    slope_pct: "",
    water_available: "media",
    irrigation_type: "gravedad",
    notes: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: farms = [], isLoading } = useQuery<any[]>({
    queryKey: ["farms"],
    queryFn: () => api("/farms"),
  });

  const approx = useMemo(() => areaHa(ring), [ring]);
  const closed = ring.length >= 4 && ring[0][0] === ring[ring.length - 1][0];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.farm_id) return setError("Selecciona una finca.");
    if (ring.length < 3) return setError("Dibuja al menos 3 vértices en el mapa.");
    setBusy(true);
    try {
      const geometryRing = closed ? ring : [...ring, ring[0]];
      const parcel = await api("/parcels", {
        method: "POST",
        body: JSON.stringify({
          farm_id: Number(form.farm_id),
          name: form.name,
          geometry: { type: "Polygon", coordinates: [geometryRing] },
          elevation_m: form.elevation_m || null,
          slope_pct: form.slope_pct || null,
          water_available: form.water_available,
          irrigation_type: form.irrigation_type || null,
          notes: form.notes || null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      navigate(`/app/parcelas/${parcel.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Spinner label="Cargando fincas…" />;

  if (!farms.length) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader eyebrow="ROOTWISE LAND" title="Primero, tu finca" description="Una finca agrupa tus parcelas. Créala en segundos." />
        <Card className="p-6">
          <p className="text-sm text-ink/55">Todavía no tienes fincas registradas.</p>
          <Link to="/app/parcelas">
            <Button className="mt-4">Ir a crear finca <ArrowRight size={14} /></Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link to="/app/parcelas" className="mb-4 inline-flex items-center gap-2 text-xs text-ink/45 hover:text-ink">
        <ArrowLeft size={14} /> Volver a parcelas
      </Link>
      <PageHeader
        eyebrow="ROOTWISE LAND"
        title="Dibuja tu parcela"
        description="Haz clic en el mapa para agregar vértices. Cierra el polígono y guarda; el servidor recalcula el área a partir de la geometría."
      />

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <Card className="p-3">
            <MapPicker ring={ring} onChange={setRing} height="h-[430px]" />
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] text-ink/50">
              <Compass size={14} className="text-leaf" />
              {ring.length === 0
                ? "Sin vértices todavía"
                : `${Math.max(0, ring.length - 1)} vértice(s) · ${closed ? "polígono cerrado" : "sin cerrar"}`}
            </div>
            <div className="text-right">
              <p className="font-display text-2xl leading-none">{approx.toFixed(2)} ha</p>
              <p className="text-[9px] uppercase tracking-[0.16em] text-ink/35">estimación local · el servidor recalcula</p>
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#6b4d12]">
            <Info size={14} className="mt-0.5 shrink-0" />
            El polígono es una delimitación de trabajo. No acredita propiedad, posesión ni
            linderos legales.
          </p>
        </div>

        <Card className="h-fit p-6">
          <DataTag>Ficha de parcela</DataTag>
          <div className="mt-5 space-y-4">
            <Field label="Finca">
              <Select
                value={form.farm_id}
                onChange={(event) => setForm({ ...form, farm_id: event.target.value })}
                required
              >
                <option value="">Selecciona una finca</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Nombre de la parcela">
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Parcela Norte"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Altitud (m)">
                <Input
                  type="number"
                  min={0}
                  max={6000}
                  value={form.elevation_m}
                  onChange={(event) => setForm({ ...form, elevation_m: event.target.value })}
                  placeholder="150"
                />
              </Field>
              <Field label="Pendiente (%)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.slope_pct}
                  onChange={(event) => setForm({ ...form, slope_pct: event.target.value })}
                  placeholder="4"
                />
              </Field>
            </div>

            <Field label="Disponibilidad de agua">
              <Select
                value={form.water_available}
                onChange={(event) => setForm({ ...form, water_available: event.target.value })}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </Select>
            </Field>

            <Field label="Tipo de riego">
              <Select
                value={form.irrigation_type}
                onChange={(event) => setForm({ ...form, irrigation_type: event.target.value })}
              >
                <option value="gravedad">Gravedad</option>
                <option value="goteo">Goteo</option>
                <option value="aspersion">Aspersión</option>
                <option value="secano">Secano</option>
                <option value="mixto">Mixto</option>
              </Select>
            </Field>

            <Field label="Notas" hint="opcional">
              <Textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Textura del suelo, cultivos previos, observaciones…"
              />
            </Field>

            {error && (
              <p className="rounded-xl border border-clay/25 bg-clay/8 px-3 py-2 text-[11px] text-clay">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={busy} disabled={ring.length < 3 || !form.name}>
              <MapPin size={15} /> Guardar parcela
            </Button>
            <p className="text-[10px] leading-relaxed text-ink/35">
              Al guardar se calculan área y centroide en el servidor. Podrás añadir suelo,
              clima y cultivos en la ficha.
            </p>
          </div>
        </Card>
      </form>
    </div>
  );
}
