import { Link } from "react-router-dom";
import { Logo } from "../components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink mesh-dark px-6 text-cream">
      <div className="text-center">
        <Logo light />
        <p className="mt-10 font-display text-[8rem] leading-none text-lime/20">404</p>
        <h1 className="font-display text-3xl tracking-tight">Esta parcela no existe.</h1>
        <p className="mt-2 text-sm text-cream/50">La página que buscas no está en el mapa.</p>
        <Link
          to="/"
          className="mt-7 inline-flex rounded-xl bg-lime px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#d6ecad]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
