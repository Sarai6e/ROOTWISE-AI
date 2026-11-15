import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudOff, CloudUpload, RefreshCw, Wifi, X } from "lucide-react";
import { flushQueue, pendingCount } from "../lib/offline";
import { useI18n } from "../lib/i18n";

export default function OfflineBar() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(pendingCount());
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState("");
  const [hidden, setHidden] = useState(false);
  const mounted = useRef(true);

  const sync = async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);
    const result = await flushQueue();
    setSyncing(false);
    setPending(pendingCount());
    if (result.synced || result.failed) {
      queryClient.invalidateQueries();
      setFlash(
        result.synced
          ? `${result.synced} cambio(s) sincronizado(s)${result.failed ? ` · ${result.failed} con error` : ""}.`
          : "Algunos cambios no se pudieron sincronizar.",
      );
      setTimeout(() => mounted.current && setFlash(""), 6000);
    }
  };

  useEffect(() => {
    const updateOnline = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) {
        setHidden(false);
        sync();
      }
    };
    const updateQueue = () => setPending(pendingCount());
    const onSynced = (event: any) => {
      setPending(pendingCount());
      const synced = event?.detail?.synced ?? 0;
      if (synced) {
        queryClient.invalidateQueries();
        setFlash(`${synced} cambio(s) sincronizado(s).`);
        setTimeout(() => mounted.current && setFlash(""), 6000);
      }
    };

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    window.addEventListener("rootwise:queue", updateQueue as EventListener);
    window.addEventListener("rootwise:synced", onSynced as EventListener);

    if (navigator.onLine && pendingCount()) sync();

    return () => {
      mounted.current = false;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("rootwise:queue", updateQueue as EventListener);
      window.removeEventListener("rootwise:synced", onSynced as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!online && hidden && !pending) return null;
  if (online && !pending && !flash) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[900] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-ink/10 bg-ink px-4 py-3 text-cream shadow-lift sm:left-auto sm:right-5 sm:mx-0">
      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${online ? "bg-lime/20 text-lime" : "bg-amber/20 text-amber"}`}>
        {syncing ? <RefreshCw size={14} className="animate-spin" /> : online ? <Wifi size={14} /> : <CloudOff size={14} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold">
          {!online
            ? t("offline.title.offline")
            : pending
              ? t("offline.title.pending")
              : t("offline.title.synced")}
        </p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-cream/55">
          {flash ||
            (!online
              ? `${t("offline.desc.offline")}${pending ? ` · ${t("offline.desc.pending", { count: pending })}` : ""}`
              : t("offline.desc.pending", { count: pending }))}
        </p>
      </div>
      {(pending > 0 || !online) && (
        <button
          onClick={sync}
          disabled={!online || syncing}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-lime px-2.5 py-1.5 text-[10px] font-semibold text-ink transition hover:bg-[#d6ecad] disabled:opacity-40"
        >
          <CloudUpload size={12} /> {t("offline.sync")}
        </button>
      )}
      <button
        onClick={() => setHidden(true)}
        className="shrink-0 text-cream/35 transition hover:text-cream"
        aria-label={t("offline.hide")}
      >
        <X size={13} />
      </button>
    </div>
  );
}
