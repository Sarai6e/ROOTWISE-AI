import { useEffect, useMemo } from "react";
import { MapContainer, Polygon, Polyline, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { RotateCcw, Trash2, Check } from "lucide-react";

type Ring = number[][];

function ClickCatcher({ onAdd, enabled }: { onAdd: (lat: number, lon: number) => void; enabled: boolean }) {
  useMapEvents({
    click(event) {
      if (enabled) onAdd(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function FitRing({ ring }: { ring: Ring }) {
  const map = useMap();
  useEffect(() => {
    if (ring.length < 3) return;
    const bounds = ring.map(([lon, lat]) => [lat, lon]) as [number, number][];
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
  }, [map, ring]);
  return null;
}

export default function MapPicker({
  ring,
  onChange,
  readOnly = false,
  height = "h-[340px]",
  center = [-12.6, -76.38],
  zoom = 13,
}: {
  ring: Ring;
  onChange?: (ring: Ring) => void;
  readOnly?: boolean;
  height?: string;
  center?: [number, number];
  zoom?: number;
}) {
  const positions = useMemo(() => ring.map(([lon, lat]) => [lat, lon] as [number, number]), [ring]);
  const closed = ring.length >= 4 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];

  const addPoint = (lat: number, lon: number) => {
    if (!onChange) return;
    const next = [...ring];
    onChange([...next, [lon, lat]]);
  };

  const undo = () => onChange?.(ring.slice(0, -1));
  const clear = () => onChange?.([]);
  const closeRing = () => {
    if (!onChange || ring.length < 3) return;
    onChange([...ring, [ring[0][0], ring[0][1]]]);
  };

  return (
    <div className={`relative ${height} w-full overflow-hidden rounded-3xl border border-ink/10`}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuyentes'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCatcher onAdd={addPoint} enabled={!readOnly} />
        <FitRing ring={ring} />
        {positions.length >= 3 && (
          <Polygon
            positions={positions}
            pathOptions={{ color: "#1F6A4A", weight: 2.5, fillColor: "#C9E68F", fillOpacity: 0.42 }}
          />
        )}
        {!closed && positions.length >= 2 && (
          <Polyline positions={positions} pathOptions={{ color: "#1F6A4A", weight: 2, dashArray: "6 6" }} />
        )}
        {positions.map((position, index) => (
          <CircleMarker
            key={`${position[0]}-${position[1]}-${index}`}
            center={position}
            radius={5}
            pathOptions={{ color: "#0E2A20", fillColor: "#F6F4EA", fillOpacity: 1, weight: 2 }}
          />
        ))}
      </MapContainer>

      {!readOnly && (
        <div className="absolute right-3 top-3 z-[400] flex flex-wrap gap-1.5">
          <button
            onClick={undo}
            disabled={!ring.length}
            className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-ink/70 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-40"
          >
            <RotateCcw size={12} /> Deshacer
          </button>
          <button
            onClick={clear}
            disabled={!ring.length}
            className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-ink/70 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-40"
          >
            <Trash2 size={12} /> Limpiar
          </button>
          <button
            onClick={closeRing}
            disabled={ring.length < 3 || closed}
            className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium text-cream shadow-sm transition hover:bg-[#173b2d] disabled:opacity-40"
          >
            <Check size={12} /> Cerrar
          </button>
        </div>
      )}

      {!readOnly && (
        <div className="absolute bottom-3 left-3 z-[400] rounded-lg border border-ink/10 bg-white/90 px-2.5 py-1.5 text-[10px] text-ink/55 shadow-sm backdrop-blur">
          {ring.length === 0
            ? "Haz clic en el mapa para agregar el primer vértice"
            : closed
              ? "Polígono cerrado · listo para guardar"
              : `${Math.max(0, ring.length - 1)} vértice(s) · cierra el polígono para guardarlo`}
        </div>
      )}
    </div>
  );
}
