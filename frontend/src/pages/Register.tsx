import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "../lib/auth";
import { LOCALES, useI18n, type LocaleCode } from "../lib/i18n";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Button, Field, Input, Logo, Select } from "../components/ui";

const REGIONS = [
  "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao",
  "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque",
  "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno",
  "San Martín", "Tacna", "Tumbes", "Ucayali",
];

export default function Register() {
  const { user, register } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    password: "",
    region: "Lima",
    phone: "",
  });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!accept) {
      setError("Marca el aviso de privacidad para continuar.");
      return;
    }
    setBusy(true);
    try {
      await register({
        username: form.username.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        password: form.password,
        region: form.region,
        phone: form.phone || undefined,
        language: locale,
      });
      navigate("/app", { replace: true });
    } catch (err: any) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream mesh-cream">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link to="/entrar" className="text-xs text-ink/50 transition hover:text-ink">
              {t("auth.register.haveAccount")}
            </Link>
          </div>
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-leaf">
              Registro manual · inclusivo
            </p>
            <h1 className="mt-3 font-display text-5xl leading-[1.02] tracking-[-0.04em]">
              {t("auth.register.headline")}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/55">
              No pedimos correo electrónico, código de verificación ni DNI para crear la
              cuenta. El DNI y la verificación oficial son opcionales y se incorporarán solo
              con integración autorizada.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink/60">
              {[
                "Funciones esenciales sin costo",
                "Datos declarados marcados como tales",
                "Elige el idioma de la interfaz",
                "Puedes eliminar tus datos cuando quieras",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-lime/40 text-ink">
                    <Check size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-lg rounded-[2rem] border border-ink/10 bg-white/85 p-6 shadow-soft sm:p-8">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs text-ink/45 transition hover:text-ink lg:hidden">
              <ArrowLeft size={14} /> Inicio
            </Link>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.03em]">{t("auth.register.title")}</h2>
            <p className="mt-1.5 text-xs text-ink/45">{t("auth.register.subtitle")}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label={t("auth.register.name")} hint={t("common.required")}>
                <Input
                  value={form.full_name}
                  onChange={(event) => update("full_name", event.target.value)}
                  placeholder="María Quispe"
                  required
                  minLength={3}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("auth.register.user")} hint="3–40">
                  <Input
                    value={form.username}
                    onChange={(event) => update("username", event.target.value)}
                    placeholder="maria.quispe"
                    required
                    minLength={3}
                    pattern="[A-Za-z0-9_.\-]{3,40}"
                  />
                </Field>
                <Field label={t("auth.register.password")} hint="8+">
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("auth.register.region")}>
                  <Select value={form.region} onChange={(event) => update("region", event.target.value)}>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("auth.register.phone")} hint={t("common.optional")}>
                  <Input
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="9XX XXX XXX"
                  />
                </Field>
              </div>

              <Field label={t("auth.register.language")}>
                <Select value={locale} onChange={(event) => setLocale(event.target.value as LocaleCode)}>
                  {LOCALES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.endonym} · {item.status === "beta" ? t("lang.beta") : t("lang.validated")}
                    </option>
                  ))}
                </Select>
              </Field>

              <label className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-sand/40 p-3.5 text-[11px] leading-relaxed text-ink/60">
                <input
                  type="checkbox"
                  checked={accept}
                  onChange={(event) => setAccept(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink/30 text-leaf accent-[#1F6A4A]"
                />
                {t("auth.register.accept")}
              </label>

              {error && (
                <p className="rounded-xl border border-clay/25 bg-clay/8 px-3.5 py-2.5 text-xs text-clay">{error}</p>
              )}

              <Button type="submit" size="lg" className="w-full" loading={busy}>
                {t("auth.register.submit")} <ArrowRight size={16} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
