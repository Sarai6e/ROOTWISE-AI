import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CloudSun,
  FlaskConical,
  Leaf,
  Satellite,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Waves,
} from "lucide-react";
import HeroScene from "../components/HeroScene";
import ParcelScene from "../components/ParcelScene";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Badge, Logo } from "../components/ui";
import { useI18n } from "../lib/i18n";

const SOURCES = [
  "NASA POWER",
  "Worldview Snapshots",
  "NASA GIBS",
  "CMR / STAC",
  "NASA EPIC",
  "FIRMS",
  "INIA",
  "SENAMHI",
  "SENASA",
  "FAOSTAT",
  "OpenStreetMap",
];

const FIELD_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1500&q=80";
const HANDS_IMAGE =
  "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1200&q=80";
const ROWS_IMAGE =
  "https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=1500&q=80";

const DEMO_GEOMETRY = {
  coordinates: [
    [
      [-76.385, -12.66],
      [-76.38, -12.66],
      [-76.3798, -12.6645],
      [-76.3849, -12.6647],
      [-76.385, -12.66],
    ],
  ],
};

export default function Landing() {
  const { t } = useI18n();
  return (
    <div className="bg-cream text-ink">
      <section className="relative min-h-[100svh] overflow-hidden bg-ink mesh-dark grain text-cream">
        <HeroScene className="pointer-events-none absolute inset-y-0 right-0 h-full w-full opacity-95 lg:w-[62%]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/10 lg:via-ink/55" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

        <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Logo light />
          <div className="hidden items-center gap-7 text-[12px] text-cream/65 md:flex">
            <a href="#reto" className="transition hover:text-lime">El reto</a>
            <a href="#plataforma" className="transition hover:text-lime">Plataforma</a>
            <a href="#datos" className="transition hover:text-lime">Datos NASA</a>
            <a href="#parcela" className="transition hover:text-lime">Parcela 3D</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher tone="dark" compact />
            <Link
              to="/entrar"
              className="rounded-xl px-3.5 py-2 text-[12px] text-cream/75 transition hover:bg-white/10 hover:text-cream"
            >
              {t("auth.login.submit")}
            </Link>
            <Link
              to="/registro"
              className="inline-flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:bg-[#d6ecad]"
            >
              {t("auth.register.title")} <ArrowRight size={14} />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-28 pt-16 sm:px-8 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <Badge tone="border-lime/30 bg-lime/10 text-lime">
              <Sparkles size={12} /> {t("landing.badge")}
            </Badge>

            <h1 className="hero-title mt-6 font-display text-[clamp(3.2rem,8vw,6.6rem)] font-light">
              {t("landing.title1")}
              <br />
              <em className="italic text-lime">{t("landing.title2")}</em>
            </h1>

            <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-cream/65 sm:text-base">
              {t("landing.lede")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/registro"
                className="inline-flex items-center gap-2 rounded-2xl bg-lime px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#d6ecad]"
              >
                {t("landing.cta")} <ArrowUpRight size={16} />
              </Link>
              <Link
                to="/entrar"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm text-cream/85 backdrop-blur transition hover:bg-white/10"
              >
                {t("landing.demo")} <ArrowRight size={15} />
              </Link>
            </div>

            <p className="mt-4 text-[11px] text-cream/35">{t("landing.hint")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              { value: "55", label: t("landing.stat.crops"), icon: Leaf },
              { value: "9", label: t("landing.stat.apis"), icon: Satellite },
              { value: "5 años", label: t("landing.stat.climate"), icon: CloudSun },
              { value: "88.3%", label: t("landing.stat.f1"), icon: Stethoscope },
            ].map((item) => (
              <div key={item.label} className="glass rounded-2xl px-4 py-4">
                <item.icon size={16} className="text-lime/80" />
                <p className="mt-3 font-display text-2xl leading-none">{item.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-cream/45">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-cream/30 sm:flex">
          <span>Desliza</span>
          <span className="h-10 w-px bg-gradient-to-b from-lime/50 to-transparent" />
        </div>
      </section>

      <div className="overflow-hidden border-y border-ink/10 bg-ink py-3.5 text-cream/45">
        <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap text-[10px] uppercase tracking-[0.24em]">
          {[...SOURCES, ...SOURCES].map((source, index) => (
            <span key={`${source}-${index}`} className="flex items-center gap-10">
              {source}
              <span className="h-1 w-1 rounded-full bg-lime/50" />
            </span>
          ))}
        </div>
      </div>

      <section id="reto" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-leaf">
              {t("landing.challenge")}
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-[-0.035em] sm:text-5xl">
              {t("landing.challengeTitle")}
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/60">
              <p>
                Los agricultores enfrentan temperaturas cambiantes, lluvias irregulares,
                escasez de agua y suelos degradados. Elegir una rotación de cultivos se
                vuelve una decisión de alto riesgo, muchas veces sin datos a mano.
              </p>
              <p>
                ROOTWISE AI responde con una herramienta de apoyo a la decisión: observación
                de la Tierra de la NASA + suelo local + características del cultivo +
                prioridades del productor, traducidas en alternativas explicadas y
                trazables.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Ciencias de la Tierra", "Software", "Artes y multimedia", "Perú"].map((tag) => (
                <span key={tag} className="rounded-full border border-ink/12 bg-white/70 px-3 py-1.5 text-[11px] text-ink/55">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-sand shadow-lift">
              <img
                src={FIELD_IMAGE}
                alt="Campo de cultivo al atardecer"
                className="h-[420px] w-full object-cover"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="absolute -bottom-6 -left-3 max-w-[260px] rounded-2xl border border-ink/10 bg-cream p-5 shadow-lift sm:-left-6">
              <p className="font-display text-lg italic leading-snug text-ink">
                “El dato no decide por ti: te explica por qué.”
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink/40">
                Principio de transparencia ROOTWISE
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="plataforma" className="border-y border-ink/10 bg-[#f0ecdd]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-leaf">{t("landing.platform")}</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[1.04] tracking-[-0.035em] sm:text-5xl">
                {t("landing.platformTitle")}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink/50">
              Cada pantalla responde una pregunta del productor y muestra siempre la fuente,
              la fecha y la incertidumbre del dato.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <article className="group relative overflow-hidden rounded-3xl border border-ink/10 bg-white/80 md:col-span-3">
              <div className="p-7">
                <FlaskConical size={22} className="text-leaf" />
                <h3 className="mt-5 font-display text-2xl tracking-tight">Simulador de aptitud</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/55">
                  Evalúa hasta 8 cultivos del catálogo global contra tu parcela, campaña y
                  restricciones. Devuelve riesgo alto, viable con restricciones o recomendable,
                  con el porqué de cada criterio.
                </p>
              </div>
              <div className="px-7 pb-7">
                <div className="space-y-3 rounded-2xl border border-ink/8 bg-sand/60 p-4">
                  {[
                    { name: "Quinua", score: 0.82, tone: "bg-lime" },
                    { name: "Maíz amiláceo", score: 0.71, tone: "bg-amber" },
                    { name: "Arroz", score: 0.34, tone: "bg-clay" },
                  ].map((crop) => (
                    <div key={crop.name} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-[11px] text-ink/60">{crop.name}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <span className={`block h-full rounded-full ${crop.tone}`} style={{ width: `${crop.score * 100}%` }} />
                      </span>
                      <span className="w-9 text-right text-[10px] tabular-nums text-ink/45">{Math.round(crop.score * 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="group relative overflow-hidden rounded-3xl border border-ink/10 bg-white/80 md:col-span-3">
              <div className="p-7">
                <CloudSun size={22} className="text-leaf" />
                <h3 className="mt-5 font-display text-2xl tracking-tight">Clima real, no promesas</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/55">
                  Promedios de 5 años de NASA POWER por coordenada: temperatura, lluvia,
                  humedad y radiación. Con resolución y limitaciones visibles.
                </p>
              </div>
              <div className="relative h-32 px-7 pb-7">
                <div className="flex h-full items-end gap-1.5">
                  {[38, 52, 61, 44, 30, 22, 18, 26, 35, 48, 56, 62].map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-leaf/20 to-leaf/70"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-ink/10 bg-white/80 p-7 md:col-span-2">
              <Satellite size={20} className="text-leaf" />
              <h3 className="mt-4 font-display text-xl tracking-tight">Ojo satelital</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
                Imagen Worldview del área de tu parcela, capas GIBS, catálogo CMR y la Tierra
                de EPIC. Todo con atribución y fecha.
              </p>
            </article>

            <article className="rounded-3xl border border-ink/10 bg-white/80 p-7 md:col-span-2">
              <Stethoscope size={20} className="text-leaf" />
              <h3 className="mt-4 font-display text-xl tracking-tight">Sanidad asistida</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
                Tu modelo de hojas de tomate clasifica 10 clases y propone manejo integrado.
                Si el modelo no está activo, la app lo dice y sigue funcionando.
              </p>
            </article>

            <article className="rounded-3xl border border-ink/10 bg-white/80 p-7 md:col-span-2">
              <ShieldCheck size={20} className="text-leaf" />
              <h3 className="mt-4 font-display text-xl tracking-tight">Datos con dueño</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
                Registro manual sin correo ni DNI obligatorio. Roles, auditoría, reportes PDF y
                modo offline con cola de sincronización.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="parcela" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div className="relative h-[420px] overflow-hidden rounded-[2rem] border border-ink/10 bg-ink">
            <ParcelScene geometry={DEMO_GEOMETRY} className="absolute inset-0 h-full w-full" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-leaf">{t("landing.parcel")}</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.04] tracking-[-0.035em] sm:text-5xl">
              {t("landing.parcelTitle")}
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink/55">
              El productor dibuja su parcela sobre el mapa; el área se calcula en el servidor
              y el visor 3D muestra la geometría sobre un relieve referencial. No acredita
              propiedad ni es una imagen en vivo: es una representación honesta.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-ink/60">
              {[
                "Dibujo con vértices, deshacer y cierre del polígono",
                "Área y centroide calculados con geometría, no declarados",
                "Vista 3D con órbita, pines y advertencia de alcance",
                "Historial de cultivos y familia botánica para rotación",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="datos" className="bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-lime/70">{t("landing.data")}</p>
              <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.035em] sm:text-5xl">
                {t("landing.dataTitle")}
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream/55">
                NASA POWER, GIBS, Worldview, CMR, EPIC y FIRMS se consumen desde el servidor
                para evitar CORS. Cada capa conserva proveedor, producto, periodo, resolución
                y fecha de consulta. Los datos satelitales son contexto regional: nunca se
                presentan como medición dentro de la parcela.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { title: "NASA POWER", text: "Clima diario y agroclimático, 5 años." },
                  { title: "Worldview / GIBS", text: "Imagen satelital y capas por fecha." },
                  { title: "CMR / EPIC / FIRMS", text: "Catálogo, Tierra diaria e incendios." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime/80">{item.title}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-cream/45">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
              <img
                src={HANDS_IMAGE}
                alt="Manos sosteniendo una planta"
                className="h-[380px] w-full object-cover"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-display text-2xl italic leading-snug text-cream">
                  “La tecnología útil se explica sola.”
                </p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-cream/45">
                  ROOTWISE AI · Perú
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <img
          src={ROWS_IMAGE}
          alt="Surcos de cultivo"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/40" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="max-w-xl text-cream">
            <Waves size={24} className="text-lime" />
            <h2 className="mt-5 font-display text-4xl leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/60">
              {t("landing.ctaText")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/registro"
                className="inline-flex items-center gap-2 rounded-2xl bg-lime px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#d6ecad]"
              >
                {t("landing.ctaButton")} <ArrowRight size={16} />
              </Link>
              <Link
                to="/entrar"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 text-sm text-cream/85 transition hover:bg-white/10"
              >
                {t("landing.login")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#081b14] text-cream/40">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <Logo light />
              <p className="mt-4 text-[12px] leading-relaxed">
                Plataforma inteligente para la gestión agrícola, la rotación de cultivos y la
                resiliencia climática.
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-cream/25">
                Proyecto NASA Space Apps Challenge 2026
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-[12px] sm:grid-cols-3">
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cream/25">Producto</p>
                <a href="#plataforma" className="block hover:text-lime">Módulos</a>
                <a href="#parcela" className="block hover:text-lime">Parcela 3D</a>
                <a href="#datos" className="block hover:text-lime">Datos NASA</a>
              </div>
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cream/25">Acceso</p>
                <Link to="/entrar" className="block hover:text-lime">Iniciar sesión</Link>
                <Link to="/registro" className="block hover:text-lime">Registro manual</Link>
                <Link to="/app" className="block hover:text-lime">Panel</Link>
              </div>
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cream/25">Créditos</p>
                <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer" className="block hover:text-lime">NASA POWER</a>
                <a href="https://www.spaceappschallenge.org/" target="_blank" rel="noreferrer" className="block hover:text-lime">Space Apps</a>
                <span className="block">Fotos: Unsplash</span>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.14em] text-cream/25 sm:flex-row">
            <span>© {new Date().getFullYear()} ROOTWISE AI · Hecho en Perú</span>
            <span>Herramienta de apoyo · no garantiza cosechas ni propiedad</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
