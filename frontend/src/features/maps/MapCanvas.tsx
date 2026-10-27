import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
export type MapPoint = {
  latitude: number;
  longitude: number;
  label: string;
  color: string;
  radius?: number;
};
export type MapArea = { geometry: GeoJsonObject; color: string; label: string };
const emptyPoints: MapPoint[] = [],
  emptyAreas: MapArea[] = [];
export function MapCanvas({
  latitude = -5.0892,
  longitude = -42.8019,
  zoom = 12,
  points = emptyPoints,
  areas = emptyAreas,
  label = "Mapa de Teresina",
}: {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  points?: MapPoint[];
  areas?: MapArea[];
  label?: string;
}) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, { scrollWheelZoom: false }).setView(
      [-5.0892, -42.8019],
      12,
    );
    map.current = m;
    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        attribution:
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
      },
    ).addTo(m);
    tiles.on("tileerror", () => setFailed(true));
    tiles.on("load", () => setFailed(false));
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    map.current?.setView([latitude, longitude], zoom);
  }, [latitude, longitude, zoom]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const group = L.layerGroup().addTo(m);
    let cancelled = false;
    try {
      for (const p of points) {
        const content = document.createElement("div");
        content.textContent = p.label;
        L.circleMarker([p.latitude, p.longitude], {
          radius: p.radius || 7,
          color: p.color,
          fillColor: p.color,
          fillOpacity: 0.8,
          weight: 2,
        })
          .bindPopup(content)
          .addTo(group);
      }
      for (const a of areas) {
        const content = document.createElement("div");
        content.textContent = a.label;
        L.geoJSON(a.geometry, {
          style: {
            color: a.color,
            fillColor: a.color,
            fillOpacity: 0.35,
            weight: 1,
          },
        })
          .bindPopup(content)
          .addTo(group);
      }
    } catch {
      queueMicrotask(() => {
        if (!cancelled) setFailed(true);
      });
    }
    return () => {
      cancelled = true;
      group.remove();
    };
  }, [points, areas]);
  return (
    <>
      {failed && (
        <p role="status">
          Algumas partes do mapa não carregaram. Os dados em tabela continuam
          disponíveis.
        </p>
      )}
      <div ref={host} className="map-canvas" role="region" aria-label={label} />
    </>
  );
}
