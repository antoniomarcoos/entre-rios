import { neighborhoods, useApp } from "../../app/AppProvider";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import { pointsSchema, firesSchema } from "../../shared/schemas";
import { localDate } from "../../shared/format";
export function useFires(enabled: boolean) {
  const { revision } = useApp();
  return useQuery("fires", (s) => json("/api/fires", firesSchema, s, 55000), {
    enabled,
    ttl: 900000,
    revision,
  });
}
export function useNight(enabled: boolean) {
  const { revision } = useApp();
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.search = new URLSearchParams({
    latitude: neighborhoods.map((n) => n.latitude).join(","),
    longitude: neighborhoods.map((n) => n.longitude).join(","),
    hourly: "temperature_2m",
    forecast_hours: "25",
    timezone: "America/Fortaleza",
  }).toString();
  return useQuery(
    "night:" + localDate(),
    (s) => json(u.toString(), pointsSchema, s, 50000),
    { enabled, ttl: 3600000, revision },
  );
}
export function nightRows(
  data: ReturnType<typeof pointsSchema.parse> | undefined,
  hour: number,
  now = Date.now(),
) {
  const cutoff = new Date(now - 10800000).toISOString().slice(0, 16);
  if (!data || data.length !== neighborhoods.length) return [];
  return data
    .flatMap((d, j) => {
      const i = d.hourly.time.findIndex(
          (t) => t >= cutoff && Number(t.slice(11, 13)) === hour,
        ),
        value = d.hourly.temperature_2m[i];
      return i >= 0 && typeof value === "number" && Number.isFinite(value)
        ? [{ neighborhood: neighborhoods[j], time: d.hourly.time[i], value }]
        : [];
    })
    .sort(
      (a, b) =>
        a.value - b.value ||
        a.neighborhood.name.localeCompare(b.neighborhood.name, "pt-BR"),
    );
}
