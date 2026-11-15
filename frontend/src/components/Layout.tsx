import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Satellite,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import OfflineBar from "./OfflineBar";
import { Logo } from "./ui";

const NAV = [
  { to: "/app", key: "nav.panel", icon: LayoutDashboard, end: true },
  { to: "/app/parcelas", key: "nav.parcels", icon: Map },
  { to: "/app/simulador", key: "nav.simulator", icon: FlaskConical },
  { to: "/app/campanas", key: "nav.campaigns", icon: CalendarDays },
  { to: "/app/sanidad", key: "nav.health", icon: Stethoscope },
  { to: "/app/nasa", key: "nav.earth", icon: Satellite },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { t, meta } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition",
      isActive
        ? "bg-lime text-ink font-semibold"
        : "text-cream/65 hover:bg-white/8 hover:text-cream",
    );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6">
        <NavLink to="/" onClick={() => setOpen(false)}>
          <Logo light />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 thin-scroll">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setOpen(false)}>
            <item.icon size={17} strokeWidth={1.8} />
            {t(item.key)}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/app/admin" className={linkClass} onClick={() => setOpen(false)}>
            <ShieldCheck size={17} strokeWidth={1.8} />
            {t("nav.admin")}
          </NavLink>
        )}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 p-3">
        <div className="px-1 pb-1">
          <LanguageSwitcher tone="dark" compact />
        </div>
        <NavLink to="/app/cuenta" className={linkClass} onClick={() => setOpen(false)}>
          <UserRound size={17} strokeWidth={1.8} />
          {user?.full_name?.split(" ")[0] || t("nav.account")}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-cream/55 transition hover:bg-white/10 hover:text-cream"
        >
          <LogOut size={17} strokeWidth={1.8} />
          {t("nav.logout")}
        </button>
        <div className="flex items-center gap-2 px-3 pt-2 text-[10px] text-cream/35">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {t("nav.online")}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] bg-ink lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[270px] bg-ink shadow-lift">
            <button
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full text-cream/60"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/85 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-7">
            <button
              className="grid h-9 w-9 place-items-center rounded-xl border border-ink/15 text-ink/70 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
            <div className="hidden items-center gap-2 text-[11px] text-ink/45 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
              {new Date().toLocaleDateString(meta.intl, { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="hidden text-[11px] text-ink/50 sm:block">{user?.region || "Perú"}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold text-lime">
                {(user?.full_name || "U").slice(0, 1).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1220px] px-4 py-7 sm:px-7 sm:py-9">
          <Outlet />
        </main>
      </div>

      <OfflineBar />
    </div>
  );
}
