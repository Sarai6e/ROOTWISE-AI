import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Leaf, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Button, Field, Input, Logo } from "../components/ui";

const IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80";

export default function Login() {
  const { user, login, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim().toLowerCase(), password);
      const from = (location.state as any)?.from || "/app";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-ink text-cream lg:block">
        <img
          src={IMAGE}
          alt="Campo al atardecer"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/">
            <Logo light />
          </Link>
          <div>
            <p className="font-display text-4xl leading-[1.05] tracking-[-0.035em]">
              “Antes de invertir,
              <br />
              <span className="italic text-lime">siembra una duda.</span>”
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/55">
              Regresa a tus parcelas, revisa el clima y ejecuta una simulación antes de
              decidir la próxima campaña.
            </p>
            <div className="mt-8 flex items-center gap-2 text-[11px] text-cream/40">
              <ShieldCheck size={14} className="text-lime/70" />
              Registro manual · sin correo verificado ni DNI obligatorio
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center gap-2 text-xs text-ink/45 transition hover:text-ink">
              <ArrowLeft size={14} /> {t("auth.login.back")}
            </Link>
            <LanguageSwitcher compact />
          </div>

          <div className="lg:hidden">
            <Logo />
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-leaf">ROOTWISE ID</p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-[-0.035em]">{t("auth.login.title")}</h1>
          <p className="mt-2 text-sm text-ink/50">{t("auth.login.subtitle")}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label={t("auth.login.user")}>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="demo"
                autoComplete="username"
                required
              />
            </Field>
            <Field label={t("auth.login.password")}>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>

            {error && (
              <p className="rounded-xl border border-clay/25 bg-clay/8 px-3.5 py-2.5 text-xs text-clay">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={busy || loading}>
              {t("auth.login.submit")} <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-4 text-[11px] leading-relaxed text-ink/50">
            <p className="flex items-center gap-1.5 font-medium text-ink/70">
              <Leaf size={13} className="text-leaf" /> {t("auth.login.demo")}
            </p>
            <p className="mt-1.5">
              Agricultor: <code className="rounded bg-sand px-1">demo</code> · Administrador:{" "}
              <code className="rounded bg-sand px-1">admin</code> · clave{" "}
              <code className="rounded bg-sand px-1">rootwise2026</code>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-ink/45">
            {t("auth.login.noAccount")}{" "}
            <Link to="/registro" className="font-medium text-leaf hover:underline">
              {t("auth.login.create")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
