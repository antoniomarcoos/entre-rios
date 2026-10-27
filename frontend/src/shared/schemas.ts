import { z } from "zod";
import type { GeoJsonObject } from "geojson";
const number = z.number().finite().nullable();
const hourly = z.object({
  time: z.array(z.string()).max(400),
  temperature_2m: z.array(number).max(400),
  relative_humidity_2m: z.array(number).optional(),
  apparent_temperature: z.array(number).optional(),
  precipitation_probability: z.array(number).optional(),
  precipitation: z.array(number).optional(),
  wind_speed_10m: z.array(number).optional(),
  wind_gusts_10m: z.array(number).optional(),
  uv_index: z.array(number).optional(),
  weather_code: z.array(number).optional(),
});
export const weatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string(),
    temperature_2m: number,
    apparent_temperature: number,
    relative_humidity_2m: number,
    wind_speed_10m: number,
    weather_code: number,
    precipitation: number,
  }),
  hourly,
});
export type Weather = z.infer<typeof weatherSchema>;
export const pointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  hourly,
});
export const pointsSchema = z.array(pointSchema).min(1).max(123);
export type PointForecast = z.infer<typeof pointSchema>;
export const seriesSchema = z.object({
  daily: z
    .object({ time: z.array(z.string()).min(1).max(16) })
    .catchall(z.union([z.array(z.string()), z.array(number)])),
  hourly: z
    .object({ time: z.array(z.string()).max(400) })
    .catchall(z.union([z.array(z.string()), z.array(number)]))
    .optional(),
});
export const airSchema = z.object({
  current: z.object({
    time: z.string(),
    pm2_5: number,
    pm10: number,
    ozone: number,
    nitrogen_dioxide: number,
  }),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: z.array(number),
    pm10: z.array(number),
  }),
});
export const gaugesSchema = z.object({
  available: z.boolean(),
  reason: z.string().optional(),
  checked_at: z.string(),
  reference: z.string().nullable(),
  stale: z.boolean().optional(),
  stations: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      active: z.boolean(),
      rain_mm: number,
    }),
  ),
});
export const waterSchema = z.object({
  retrieved_at: z.string(),
  stations: z.array(
    z.object({
      nome: z.string(),
      corpoHidrico: z.string(),
      dataColeta: z.string(),
      ph: number,
      odMgL: number,
      turbidez: number,
      iqa: number,
    }),
  ),
});
export const riverSchema = z.object({
  retrieved_at: z.string(),
  station: z.string(),
  readings: z
    .array(z.object({ time: z.string(), value: z.number().finite() }))
    .min(1)
    .max(10000),
});
export function isGeometry(value: unknown): value is GeoJsonObject {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (
    ![
      "Polygon",
      "MultiPolygon",
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "GeometryCollection",
      "Feature",
      "FeatureCollection",
    ].includes(String(v.type))
  )
    return false;
  let count = 0;
  const walk = (x: unknown, depth = 0): boolean => {
    if (++count > 500000 || depth > 12) return false;
    if (typeof x === "number")
      return Number.isFinite(x) && Math.abs(x) <= 100000;
    if (x === null || typeof x === "string" || typeof x === "boolean")
      return true;
    if (Array.isArray(x)) return x.every((y) => walk(y, depth + 1));
    if (typeof x === "object" && x)
      return Object.values(x).every((y) => walk(y, depth + 1));
    return false;
  };
  return walk(v);
}
const geometry = z.custom<GeoJsonObject>(isGeometry, "Geometria inválida");
export const warningSchema = z.object({
  id: z.union([z.string(), z.number()]),
  period: z.string(),
  title: z.string(),
  severity: z.string(),
  color: z.string().regex(/^#[\da-f]{6}$/i),
  start: z.string(),
  end: z.string(),
  teresina: z.boolean(),
  risks: z.array(z.string()).nullish(),
  instructions: z.array(z.string()).nullish(),
  geometry,
});
export const warningsSchema = z.object({
  checked_at: z.string(),
  data: z.array(warningSchema).max(1000),
});
export type Warning = z.infer<typeof warningSchema>;
export const officialForecastSchema = z.object({
  checked_at: z.string(),
  data: z
    .array(
      z.object({
        name: z.string(),
        summary: z.string(),
        min: z.union([number, z.string()]),
        max: z.union([number, z.string()]),
        color: z.string().max(80),
        geometry,
      }),
    )
    .max(5000),
});
export const floodSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      geometry,
      properties: z.object({ TR_ANO: z.number() }).passthrough(),
    }),
  ),
  retrieved_at: z.string(),
});
export const firesSchema = z.object({
  checked_at: z.string(),
  latest: z.number(),
  start: z.number(),
  end: z.number(),
  detections: z.array(
    z.object({
      time: z.number(),
      lat: z.number(),
      lon: z.number(),
      satellite: z.string(),
    }),
  ),
});
export const climateSchema = z.object({
  provider: z.literal("NASA POWER / MERRA-2"),
  checked_at: z.string(),
  saved_copy: z.boolean(),
  trend_period: z.array(z.number()).length(2),
  trend_per_decade: number,
  missing_months: z.number(),
  point: z.object({ latitude: z.number(), longitude: z.number() }),
  baseline: z.array(z.object({ month: z.number(), mean: number })),
  annual: z
    .array(z.object({ year: z.number(), mean: number, months: z.number() }))
    .min(1),
  monthly: z
    .array(
      z.object({
        year: z.number(),
        month: z.number(),
        mean: number,
        reference: number,
        anomaly: number,
        provisional: z.boolean(),
      }),
    )
    .min(1),
});
export type Climate = z.infer<typeof climateSchema>;
