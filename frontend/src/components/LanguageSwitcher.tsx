import { Globe2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LOCALES, useI18n, type LocaleCode } from "../lib/i18n";

export default function LanguageSwitcher({
  tone = "light",
  compact = false,
}: {
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const { locale, setLocale, meta } = useI18n();
  const { user, refresh } = useAuth();

  const change = async (code: LocaleCode) => {
    setLocale(code);
    if (user) {
      try {
        await api("/auth/me", { method: "PATCH", body: JSON.stringify({ language: code }) });
        await refresh();
      } catch {
        /* el idioma local ya quedó guardado */
      }
    }
  };

  const dark = tone === "dark";

  return (
    <div className="relative inline-flex items-center">
      <Globe2
        size={compact ? 13 : 15}
        className={`pointer-events-none absolute left-2.5 ${dark ? "text-lime/70" : "text-leaf/70"}`}
      />
      <select
        aria-label={meta.label}
        value={locale}
        onChange={(event) => change(event.target.value as LocaleCode)}
        className={`appearance-none rounded-xl border py-2 pl-8 pr-7 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-leaf/20 ${
          dark
            ? "border-white/15 bg-white/5 text-cream/80 hover:bg-white/10"
            : "border-ink/10 bg-white/70 text-ink/65 hover:bg-white"
        }`}
      >
        {LOCALES.map((item) => (
          <option key={item.code} value={item.code} className="text-ink">
            {item.endonym}
            {item.status === "beta" ? " · beta" : ""}
          </option>
        ))}
      </select>
      <span
        className={`pointer-events-none absolute right-2 text-[8px] ${dark ? "text-cream/40" : "text-ink/35"}`}
      >
        ▾
      </span>
    </div>
  );
}
