import { fetchPublic as fetch } from "./public-fetch.mjs";
export const climatePoint = { latitude: -5.0892, longitude: -42.8019 };
export function climateUrl(year = new Date().getUTCFullYear()) {
  return (
    "https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M&community=RE&longitude=-42.8019&latitude=-5.0892&format=JSON&start=1981&end=" +
    year
  );
}
export function linearTrend(rows) {
  if (rows.length < 20) return null;
  const x = rows.reduce((s, r) => s + r.year, 0) / rows.length,
    y = rows.reduce((s, r) => s + r.mean, 0) / rows.length;
  return (
    (rows.reduce((s, r) => s + (r.year - x) * (r.mean - y), 0) /
      rows.reduce((s, r) => s + (r.year - x) ** 2, 0)) *
    10
  );
}
export function analyzeClimate(raw, now = Date.now()) {
  const values = raw?.properties?.parameter?.T2M;
  if (
    !values ||
    raw?.parameters?.T2M?.units !== "C" ||
    !raw.header?.sources?.includes("MERRA2")
  )
    throw Error("Série NASA incompatível");
  const current = new Date(now - 10800000)
    .toISOString()
    .slice(0, 7)
    .replace("-", "");
  const lastYear = Number(current.slice(0, 4)),
    fill = raw.header.fill_value;
  const monthly = [];
  for (let year = 1981; year <= lastYear; year++)
    for (let month = 1; month <= 12; month++) {
      const key = String(year) + String(month).padStart(2, "0");
      if (key >= current) continue;
      const v = values[key],
        mean =
          typeof v === "number" &&
          Number.isFinite(v) &&
          v !== fill &&
          v >= -50 &&
          v <= 60
            ? v
            : null;
      monthly.push({
        year,
        month,
        mean,
        provisional:
          year * 12 + month > lastYear * 12 + Number(current.slice(4)) - 3,
      });
    }
  const baseline = Array.from({ length: 12 }, (_, i) => {
    const rows = monthly.filter(
      (r) =>
        r.month === i + 1 &&
        r.year >= 1991 &&
        r.year <= 2020 &&
        r.mean !== null,
    );
    return {
      month: i + 1,
      years: rows.length,
      mean:
        rows.length === 30 ? rows.reduce((s, r) => s + r.mean, 0) / 30 : null,
    };
  });
  for (const row of monthly) {
    const ref = baseline[row.month - 1].mean;
    row.reference = ref;
    row.anomaly = row.mean !== null && ref !== null ? row.mean - ref : null;
  }
  const annual = [];
  for (let year = 1981; year < lastYear; year++) {
    const rows = monthly.filter((r) => r.year === year && r.mean !== null);
    let mean = null;
    if (rows.length === 12) {
      const weights = rows.map((r) =>
        new Date(Date.UTC(year, r.month, 0)).getUTCDate(),
      );
      mean =
        rows.reduce((s, r, i) => s + r.mean * weights[i], 0) /
        weights.reduce((a, b) => a + b, 0);
    }
    annual.push({ year, months: rows.length, mean });
  }
  const complete = annual.filter((r) => r.mean !== null);
  if (complete.length < 20) throw Error("Histórico insuficiente");
  return {
    point: climatePoint,
    provider: "NASA POWER / MERRA-2",
    resolution: "0,5° × 0,625°",
    parameter: "T2M",
    units: "°C",
    baseline_period: [1991, 2020],
    baseline,
    monthly,
    annual,
    trend_per_decade: linearTrend(complete),
    trend_period: [complete[0].year, complete.at(-1).year],
    source_header: raw.header,
    missing_months: monthly.filter((r) => r.mean === null).length,
  };
}
// Bound the whole operation, including stalled response bodies. The route can
// then promptly fall back to its dated, real NASA snapshot.
export async function loadClimateWithin(load, timeoutMs = 6000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => load(controller.signal)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(Error("Tempo de consulta NASA excedido"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
let cache = null,
  pending = null,
  failedAt = 0;
export async function liveClimate() {
  if (cache && Date.now() - Date.parse(cache.checked_at) < 86400000)
    return cache;
  if (pending) return pending;
  if (failedAt && Date.now() - failedAt < 300000)
    throw Error("NASA temporariamente indisponível");
  pending = loadClimateWithin(async (signal) => {
    const url = climateUrl();
    const r = await fetch(url, { signal });
    if (!r.ok) throw Error("NASA indisponível");
    const raw = await r.json();
    const result = {
      ...analyzeClimate(raw),
      source_url: url,
      checked_at: new Date().toISOString(),
      saved_copy: false,
    };
    cache = result;
    failedAt = 0;
    return result;
  });
  try {
    return await pending;
  } catch (error) {
    failedAt = Date.now();
    throw error;
  } finally {
    pending = null;
  }
}
