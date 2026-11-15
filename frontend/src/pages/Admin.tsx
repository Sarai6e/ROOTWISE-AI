import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Leaf, Map, ShieldCheck, Trash2, Users, Activity, FlaskConical } from "lucide-react";
import { api } from "../lib/api";
import { fechaHora, ha } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { Badge, Button, Card, DataTag, EmptyState, PageHeader, Select, Spinner, Stat } from "../components/ui";

export default function Admin() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["admin", "stats"],
    queryFn: () => api("/admin/stats"),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["admin", "users", search],
    queryFn: () => api(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  const { data: audit = [] } = useQuery<any[]>({
    queryKey: ["admin", "audit"],
    queryFn: () => api("/admin/audit?limit=40"),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      api(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (err: any) => setError(err.message),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: any) => setError(err.message),
  });

  if (statsLoading || usersLoading) return <Spinner label="Cargando administración…" />;

  return (
    <div>
      <PageHeader
        eyebrow="GOBIERNO Y AUDITORÍA"
        title={t("admin.title")}
        description={t("admin.desc")}
        actions={<Badge tone="bg-ink text-lime border-ink"><ShieldCheck size={12} /> rol admin</Badge>}
      />

      {error && <p className="mb-4 rounded-xl border border-clay/25 bg-clay/8 px-3.5 py-2.5 text-[11px] text-clay">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Usuarios" value={stats?.users ?? 0} hint={`${stats?.users_by_role?.admin ?? 0} admin · ${stats?.users_by_role?.tecnico ?? 0} técnicos`} icon={<Users size={16} />} />
        <Stat label="Parcelas" value={stats?.parcels ?? 0} hint={`${stats?.farms ?? 0} fincas`} icon={<Map size={16} />} />
        <Stat label="Superficie total" value={ha(stats?.hectares)} hint="suma de áreas calculadas" icon={<Leaf size={16} />} />
        <Stat label="Simulaciones" value={stats?.simulations ?? 0} hint={`${stats?.crops ?? 0} cultivos en catálogo`} icon={<FlaskConical size={16} />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">Usuarios y roles</h2>
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink/35">control de acceso</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuario…"
              className="rounded-xl border border-ink/15 bg-white/80 px-3 py-2 text-xs placeholder:text-ink/30 focus:border-leaf focus:outline-none"
            />
          </div>

          <div className="thin-scroll mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[11px]">
              <thead>
                <tr className="border-b border-ink/10 text-[9px] uppercase tracking-[0.14em] text-ink/35">
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 font-medium">Región</th>
                  <th className="pb-2 font-medium">Rol</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b border-ink/6 last:border-0">
                    <td className="py-2.5 pr-2">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-[9px] uppercase tracking-wider text-ink/35">@{user.username}</p>
                    </td>
                    <td className="py-2.5 pr-2 text-ink/50">{user.region || "—"}</td>
                    <td className="py-2.5 pr-2">
                      <Select
                        value={user.role}
                        onChange={(event) => updateUser.mutate({ id: user.id, body: { role: event.target.value } })}
                        className="w-[110px] px-2 py-1 text-[11px]"
                      >
                        <option value="agricultor">agricultor</option>
                        <option value="tecnico">técnico</option>
                        <option value="admin">admin</option>
                      </Select>
                    </td>
                    <td className="py-2.5 pr-2">
                      <button
                        onClick={() =>
                          updateUser.mutate({
                            id: user.id,
                            body: { status: user.status === "activo" ? "suspendido" : "activo" },
                          })
                        }
                      >
                        <Badge tone={user.status === "activo" ? "bg-lime/25 border-lime/40 text-ink/70" : "bg-clay/10 border-clay/25 text-clay"}>
                          {user.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar a ${user.username}? Se borrarán sus fincas.`)) deleteUser.mutate(user.id);
                        }}
                        className="text-ink/25 transition hover:text-clay"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-leaf" />
            <h2 className="font-display text-2xl tracking-tight">Auditoría</h2>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink/35">últimas 40 acciones</p>
          <div className="thin-scroll mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {audit.map((entry: any) => (
              <div key={entry.id} className="rounded-xl border border-ink/8 bg-white/60 px-3 py-2">
                <p className="text-[11px] font-medium">{entry.action.replaceAll(".", " · ")}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink/35">
                  {entry.entity_type || "sistema"} #{entry.entity_id ?? "—"} · actor {entry.actor_id ?? "anónimo"}
                </p>
                <p className="text-[9px] text-ink/30">{fechaHora(entry.occurred_at)}</p>
              </div>
            ))}
            {!audit.length && <EmptyState title="Sin eventos" />}
          </div>
        </Card>
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <DataTag>Estado del modelo</DataTag>
          <p className="mt-2 text-[11px] text-ink/50">
            {stats?.diagnoses ?? 0} diagnóstico(s) de hoja registrados · módulo de IA opcional con
            fallback explícito.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin"] })}>
          <Activity size={13} /> Actualizar métricas
        </Button>
      </Card>
    </div>
  );
}
