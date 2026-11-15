import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudOff, CloudUpload, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LOCALES, useI18n, type LocaleCode } from "../lib/i18n";
import { flushQueue, pendingCount } from "../lib/offline";
import { Badge, Button, Card, DataTag, Field, Input, PageHeader, Select, Spinner } from "../components/ui";

export default function Account() {
  const { user, refresh, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    region: user?.region || "",
    phone: user?.phone || "",
    dni: user?.dni || "",
  });
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(pendingCount());
  const [syncMessage, setSyncMessage] = useState("");

  if (!user) return <Spinner />;

  const saveProfile = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/auth/me", { method: "PATCH", body: JSON.stringify(form) });
      await refresh();
      setMessage("Perfil actualizado.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/auth/me", { method: "PATCH", body: JSON.stringify(passwords) });
      setPasswords({ current_password: "", new_password: "" });
      setMessage("Contraseña actualizada.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const applyLanguage = async (code: LocaleCode) => {
    setLocale(code);
    try {
      await api("/auth/me", { method: "PATCH", body: JSON.stringify({ language: code }) });
      await refresh();
      setMessage(t("account.langSaved"));
    } catch {
      /* queda guardado localmente */
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="ROOTWISE ID"
        title={t("account.title")}
        description={t("account.desc")}
        actions={
          <Badge tone="bg-sand border-ink/10 text-ink/60 capitalize">
            <ShieldCheck size={12} /> rol {user.role}
          </Badge>
        }
      />

      {(message || error) && (
        <p className={`mb-4 rounded-xl border px-3.5 py-2.5 text-[11px] ${error ? "border-clay/25 bg-clay/8 text-clay" : "border-leaf/25 bg-lime/15 text-ink/70"}`}>
          {error || message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5">
          <DataTag>{t("account.profile")}</DataTag>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nombre completo" className="sm:col-span-2">
              <Input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
            </Field>
            <Field label="Región">
              <Input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} placeholder="Lima" />
            </Field>
            <Field label="Celular" hint="opcional">
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </Field>
            <Field label="DNI" hint={t("common.optional")}>
              <Input value={form.dni} onChange={(event) => setForm({ ...form, dni: event.target.value })} maxLength={8} />
            </Field>
            <div className="flex items-end">
              <p className="pb-2 text-[10px] leading-relaxed text-ink/35">
                {t("lang.note")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[10px] leading-relaxed text-ink/35">
              Los datos sin verificación oficial se muestran como declarados.
            </p>
            <Button onClick={saveProfile} loading={busy}>Guardar perfil</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <DataTag>Seguridad</DataTag>
            <div className="mt-4 space-y-3">
              <Field label="Contraseña actual">
                <Input type="password" value={passwords.current_password} onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })} />
              </Field>
              <Field label="Nueva contraseña" hint="mínimo 8">
                <Input type="password" value={passwords.new_password} onChange={(event) => setPasswords({ ...passwords, new_password: event.target.value })} />
              </Field>
              <Button
                variant="outline"
                onClick={changePassword}
                disabled={!passwords.current_password || passwords.new_password.length < 8}
                loading={busy}
              >
                Cambiar contraseña
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <DataTag>{t("account.language")}</DataTag>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/45">{t("account.languageDesc")}</p>
            <div className="mt-3 space-y-1.5">
              {LOCALES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => applyLanguage(item.code)}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    locale === item.code
                      ? "border-leaf/40 bg-lime/15"
                      : "border-ink/8 bg-white/60 hover:border-ink/20 hover:bg-white"
                  }`}
                >
                  <div>
                    <p className="text-[12px] font-medium">{item.endonym}</p>
                    <p className="text-[9px] uppercase tracking-wider text-ink/35">
                      {item.region} · {item.note}
                    </p>
                  </div>
                  <Badge
                    tone={
                      item.status === "beta"
                        ? "bg-amber/15 border-amber/40 text-[#6b4d12]"
                        : "bg-lime/20 border-lime/40 text-ink/70"
                    }
                  >
                    {item.status === "beta" ? t("lang.beta") : t("lang.validated")}
                  </Badge>
                </button>
              ))}
            </div>
            {locale === "ash" && (
              <p className="mt-2 rounded-lg border border-amber/25 bg-amber/10 px-2.5 py-2 text-[10px] leading-relaxed text-[#6b4d12]">
                {t("lang.ashFallback")}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <DataTag>{t("account.offline")}</DataTag>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/45">
              ROOTWISE guarda en este dispositivo la última información consultada y los
              cambios que hagas sin Internet. Al recuperar la conexión, la cola se sincroniza
              automáticamente.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-ink/8 bg-sand/50 px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-ink/60">
                {navigator.onLine ? <CloudUpload size={13} className="text-leaf" /> : <CloudOff size={13} className="text-amber" />}
                {navigator.onLine ? "En línea" : "Sin conexión"} · {pending} cambio(s) en cola
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!pending || !navigator.onLine}
                onClick={async () => {
                  const result = await flushQueue();
                  setPending(pendingCount());
                  setSyncMessage(`${result.synced} sincronizado(s) · ${result.failed} con error`);
                }}
              >
                Sincronizar
              </Button>
            </div>
            {syncMessage && <p className="mt-2 text-[10px] text-ink/40">{syncMessage}</p>}
            <p className="mt-2 text-[10px] leading-relaxed text-ink/35">
              Instala la PWA desde el menú del navegador para abrirla como app y conservar la
              caché. Los datos no sincronizados viven en este dispositivo.
            </p>
          </Card>

          <Card className="p-5">
            <DataTag>{t("account.privacy")}</DataTag>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/45">
              Puedes solicitar la eliminación de tus datos. ROOTWISE no vende información ni
              entrena modelos identificables con tus parcelas.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="danger"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                <LogOut size={14} /> Cerrar sesión
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.alert("Solicitud registrada. En esta demo, contacta al administrador del despliegue para completar la eliminación.")}
              >
                <Trash2 size={14} /> Solicitar eliminación
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <DataTag>Transparencia</DataTag>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-ink/45">
          ROOTWISE AI es una herramienta de apoyo a decisiones. No acredita propiedad de
          terrenos, no garantiza cosechas ni reemplaza el diagnóstico de un agrónomo. Las
          recomendaciones conservan fuente, fecha, supuestos y datos faltantes.
        </p>
      </Card>
    </div>
  );
}
