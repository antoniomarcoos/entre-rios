import assert from "node:assert/strict";
import {
  analyzeClimate,
  linearTrend,
  loadClimateWithin,
} from "../backend/lib/climate-data.mjs";
const values = {};
for (let year = 1981; year <= 2026; year++)
  for (let month = 1; month <= 13; month++)
    values[String(year) + String(month).padStart(2, "0")] =
      month === 13 ? 999 : 20 + (year - 1981) * 0.1 + month * 0.1;
const raw = {
  properties: { parameter: { T2M: values } },
  parameters: { T2M: { units: "C" } },
  header: { sources: ["MERRA2"], fill_value: -999 },
};
const now = Date.parse("2026-10-23T15:00:00Z");
const d = analyzeClimate(raw, now);
assert.deepEqual(d.trend_period, [1981, 2025]);
assert.equal(d.monthly.at(-1).month, 9);
assert.equal(d.monthly.at(-1).provisional, true);
assert.equal(d.baseline[0].years, 30);
assert.ok(Math.abs(d.baseline[0].mean - 22.55) < 1e-10);
assert.ok(d.annual.every((r) => r.mean < 40));
const leap = d.annual.find((r) => r.year === 2024);
const weighted = Array.from({ length: 12 }, (_, i) => ({
  days: new Date(Date.UTC(2024, i + 1, 0)).getUTCDate(),
  value: values["2024" + String(i + 1).padStart(2, "0")],
}));
assert.ok(
  Math.abs(
    leap.mean - weighted.reduce((s, r) => s + r.days * r.value, 0) / 366,
  ) < 1e-10,
);
assert.ok(Math.abs(d.trend_per_decade - 1) < 0.001);
values["200001"] = -999;
const missing = analyzeClimate(raw, now);
assert.equal(missing.annual.find((r) => r.year === 2000).mean, null);
assert.equal(missing.baseline[0].mean, null);
assert.equal(
  missing.monthly.find((r) => r.year === 2025 && r.month === 1).anomaly,
  null,
);
assert.equal(
  missing.monthly.find((r) => r.year === 2000 && r.month === 1).mean,
  null,
);
assert.equal(missing.missing_months, 1);
values["200001"] = "25";
assert.equal(analyzeClimate(raw, now).missing_months, 1);
assert.equal(linearTrend([{ year: 2000, mean: 25 }]), null);
assert.throws(() => analyzeClimate({}));
assert.throws(() =>
  analyzeClimate({ ...raw, parameters: { T2M: { units: "K" } } }),
);
console.log(
  "PASS climate: complete-year trend, daily-weighted mean, 30-year monthly baseline, fill values, no zero coercion, annual key ignored, current month excluded and provisional months.",
);

// Even an upstream body ignoring abort cannot hold the historical endpoint open.
let timedSignal;
await assert.rejects(
  loadClimateWithin((signal) => {
    timedSignal = signal;
    return new Promise(() => {});
  }, 15),
  /Tempo de consulta/,
);
assert.equal(timedSignal.aborted, true);
assert.equal(await loadClimateWithin(async () => 42, 100), 42);
const snapshot = JSON.parse(
  await (
    await import("node:fs/promises")
  ).readFile(new URL("../backend/lib/climate-snapshot.json", import.meta.url), "utf8"),
);
const { climateSchema } = await import("../frontend/src/shared/schemas.ts");
assert.ok(
  climateSchema.parse({
    ...analyzeClimate(snapshot.raw),
    checked_at: snapshot.checked_at,
    saved_copy: true,
  }).annual.length > 20,
);
console.log(
  "PASS climate timeout aborts stalled upstream; saved real history validates against frontend schema.",
);
