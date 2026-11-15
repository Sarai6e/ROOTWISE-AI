import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { fetchBlobUrl } from "../lib/api";

export default function AuthedImage({
  path,
  alt,
  className,
  loadingLabel = "Cargando imagen…",
}: {
  path: string;
  alt: string;
  className?: string;
  loadingLabel?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let created: string | null = null;
    setUrl(null);
    setError(false);
    fetchBlobUrl(path)
      .then((value) => {
        created = value;
        if (active) setUrl(value);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [path]);

  if (error) {
    return (
      <div className={`grid place-items-center bg-sand/70 text-center text-[11px] text-ink/45 ${className || ""}`}>
        <div className="px-4">
          <ImageOff size={18} className="mx-auto mb-2 opacity-60" />
          Imagen no disponible en este momento.
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`skeleton grid place-items-center text-[10px] uppercase tracking-[0.18em] text-ink/30 ${className || ""}`}>
        {loadingLabel}
      </div>
    );
  }

  return <img src={url} alt={alt} className={className} />;
}
