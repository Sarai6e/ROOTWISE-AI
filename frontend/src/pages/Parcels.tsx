import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Map, Plus, Sprout, Trash2, Warehouse } from "lucide-react";
import { api } from "../lib/api";
import { ha } from "../lib/format";
import MapPicker from "../components/MapPicker";
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, Spinner, Textarea } from "../components/ui";

export default function Parcels() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", locality: "", notes: "" });
  const [error, setError] = useState("");

  const { data: farms = [], isLoading } = useQuery<any[]>({
    queryKey: ["farms"],
    queryFn: () => api("/farms"),
  });

  const createFarm = useMutation({
    mutationFn: () =>
      api("/farms", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          locality: form.locality || undefined,
          notes: form.notes || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setOpen(false);
      setForm({ name: "", locality: "", notes: "" });
      setError("");
    },
    onError: (err: any) => setError(err.message),
  });

  const deleteParcel = useMutation({
    mutationFn: (id: number) => api(`/parcels/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farms"] }),
    onError: (err: any) => window.alert(err.message),
  });

  if (isLoading) return <Spinner label="Cargando parcelas…" />;

  const totalParcels = farms.reduce((sum, farm) => sum + (farm.parcels?.length || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="ROOTWISE LAND"
        title="Mis parcelas"
        description="Dibuja el perímetro de cada parcela, revisa su área y mantén el historial de cultivos. El polígono es una delimitación de trabajo: no acredita propiedad."
        actions={
          <>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Warehouse size={15} /> Nueva finca
            </Button>
            <Link to="/app/parcelas/nueva">
              <Button>
                <Plus size={15} /> Nueva parcela
              </Button>
            </Link>
          </>
        }
      />

      {!totalParcels && (
        <EmptyState
          icon={<Map size={22} />}
          title="Aún no hay parcelas"
          description="Crea una finca, luego dibuja el polígono de tu parcela sobre el mapa. Puedes hacerlo en menos de un minuto."
          action={
            <Link to="/app/parcelas/nueva">
              <Button><Plus size={14} /> Crear mi primera parcela</Button>
            </Link>
          }
        />
      )}

      <div className="space-y-8">
        {farms.map((farm) => (
          <section key={farm.id}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl tracking-tight">{farm.name}</h2>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink/40">
                  {farm.locality || "Sin localidad"} · {farm.parcels?.length || 0} parcela(s)
                </p>
              </div>
            </div>

            {farm.parcels?.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {farm.parcels.map((parcel: any) => (
                  <Card key={parcel.id} className="group overflow-hidden p-0">
                    <div className="relative h-40 overflow-hidden">
                      <MapPicker
                        ring={parcel.geometry?.coordinates?.[0] || []}
                        readOnly
                        height="h-40"
                        center={[parcel.centroid_lat, parcel.centroid_lon]}
                        zoom={15}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-xl tracking-tight">{parcel.name}</h3>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-ink/40">
                            {ha(parcel.area_ha)} · {parcel.water_available || "media"} agua
                          </p>
                        </div>
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime/25 text-leaf">
                          <Sprout size={16} />
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg bg-sand/60 px-2.5 py-2">
                          <p className="text-ink/40">Altitud</p>
                          <p className="font-medium">{parcel.elevation_m ? `${parcel.elevation_m} m` : "sin dato"}</p>
                        </div>
                        <div className="rounded-lg bg-sand/60 px-2.5 py-2">
                          <p className="text-ink/40">Riego</p>
                          <p className="font-medium capitalize">{parcel.irrigation_type || "—"}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Link to={`/app/parcelas/${parcel.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Abrir ficha <ArrowRight size={13} />
                          </Button>
                        </Link>
                        <button
                          title="Eliminar parcela"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar “${parcel.name}”? Se borrarán sus campañas y análisis.`)) {
                              deleteParcel.mutate(parcel.id);
                            }
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-clay/20 text-clay/70 transition hover:bg-clay/10"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/15 bg-white/40 px-5 py-8 text-center text-sm text-ink/45">
                Esta finca aún no tiene parcelas.
                <Link to="/app/parcelas/nueva" className="ml-1.5 font-medium text-leaf hover:underline">
                  Dibujar una
                </Link>
              </div>
            )}
          </section>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva finca">
        <div className="space-y-4">
          <Field label="Nombre de la finca">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Finca La Esperanza"
            />
          </Field>
          <Field label="Localidad" hint="opcional">
            <Input
              value={form.locality}
              onChange={(event) => setForm({ ...form, locality: event.target.value })}
              placeholder="Cañete, Lima"
            />
          </Field>
          <Field label="Notas" hint="opcional">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Fuente de agua, acceso, prácticas…"
            />
          </Field>
          {error && <p className="text-xs text-clay">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createFarm.mutate()}
              loading={createFarm.isPending}
              disabled={form.name.trim().length < 2}
            >
              Crear finca
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
