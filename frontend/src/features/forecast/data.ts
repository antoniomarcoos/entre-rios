export type Series = Record<string, Array<number | null> | string[]> & {
  time: string[];
};
export type ForecastResponse = { daily?: Series; hourly?: Series };
export type Day = {
  date: string;
  max: number | null;
  min: number | null;
  rain: number | null;
  gust: number | null;
  uv: number | null;
};
export type ModelRow = Omit<Day, "date" | "uv"> & { name: string };
export type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};
export const models = [
  ["ecmwf_ifs025", "ECMWF IFS"],
  ["gfs_seamless", "GFS"],
  ["icon_global", "ICON"],
] as const;
export const value = (v: unknown, min = -80, max = 80): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
    ? v
    : null;
export function daily(data: ForecastResponse): Day[] {
  const d = data?.daily;
  if (!Array.isArray(d?.time)) throw Error("Previsão diária ausente");
  return d.time.slice(0, 7).map((date, i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw Error("Data da previsão inválida");
    return {
      date,
      max: value(d.temperature_2m_max?.[i]),
      min: value(d.temperature_2m_min?.[i]),
      rain: value(d.precipitation_sum?.[i], 0, 2000),
      gust: value(d.wind_gusts_10m_max?.[i], 0, 500),
      uv: value(d.uv_index_max?.[i], 0, 30),
    };
  });
}
export function comparison(
  data: ForecastResponse | null,
  date: string,
): ModelRow[] {
  const d = data?.daily,
    i = d?.time?.indexOf(date);
  if (!d || i === undefined || i < 0) return [];
  return models.map(([id, name]) => ({
    name,
    max: value(d["temperature_2m_max_" + id]?.[i]),
    min: value(d["temperature_2m_min_" + id]?.[i]),
    rain: value(d["precipitation_sum_" + id]?.[i], 0, 2000),
    gust: value(d["wind_gusts_10m_max_" + id]?.[i], 0, 500),
  }));
}
export function spread(
  rows: ModelRow[],
  key: "max" | "min" | "rain" | "gust",
): number | null {
  const values = rows.map((r) => r[key]).filter((v): v is number => v !== null);
  return values.length < 2 ? null : Math.max(...values) - Math.min(...values);
}
export const uvCategory = (v: number | null) =>
  v === null || !Number.isFinite(v)
    ? "Sem dado"
    : v < 3
      ? "Baixo"
      : v < 6
        ? "Moderado"
        : v < 8
          ? "Alto"
          : v < 11
            ? "Muito alto"
            : "Extremo";
export const nf = (v: number | null, digits = 0) =>
  v === null || !Number.isFinite(v)
    ? "—"
    : v.toLocaleString("pt-BR", { maximumFractionDigits: digits });
export const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Fortaleza",
  }).format(new Date(date + "T12:00:00-03:00"));
export const checkedLabel = (date: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Fortaleza",
  }).format(date);
export function forecastURLs(location: Location) {
  const base = new URL("https://api.open-meteo.com/v1/forecast");
  base.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: "America/Fortaleza",
    forecast_days: "7",
  }).toString();
  const fields =
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max";
  const week = new URL(base);
  week.searchParams.set("daily", fields + ",uv_index_max");
  week.searchParams.set("hourly", "uv_index");
  const model = new URL(base);
  model.searchParams.set("daily", fields);
  model.searchParams.set("models", models.map(([id]) => id).join(","));
  return { week: week.toString(), models: model.toString() };
}
