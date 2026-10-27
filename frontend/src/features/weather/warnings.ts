import type { Warning } from "../../shared/schemas";
import { parseTime } from "../../shared/format.ts";
export function selectCityWarnings(data: Warning[], now = Date.now()) {
  return data
    .filter(
      (a) =>
        a.teresina &&
        Number.isFinite(parseTime(a.start)) &&
        parseTime(a.end) >= now,
    )
    .map((a) => ({ ...a, active: parseTime(a.start) <= now }))
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        parseTime(a.start) - parseTime(b.start),
    );
}
