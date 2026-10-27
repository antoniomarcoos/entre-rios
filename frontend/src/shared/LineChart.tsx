import { useState } from "react";
import { nf, shortTime } from "./format";
export type ChartSeries = {
  label: string;
  color: string;
  values: (number | null)[];
};
export function LineChart({
  times,
  series,
  unit,
  label,
  zero = false,
  maxGapMs,
}: {
  times: string[];
  series: ChartSeries[];
  unit: string;
  label: string;
  zero?: boolean;
  maxGapMs?: number;
}) {
  const [selected, setSelected] = useState<number | null>(null),
    all = series
      .flatMap((s) => s.values)
      .filter((v): v is number => v !== null && Number.isFinite(v));
  if (!times.length || !all.length)
    return <p>Sem dados para desenhar o gráfico.</p>;
  const lo = zero ? 0 : Math.floor(Math.min(...all) - 1),
    hi = Math.max(lo + 1, Math.ceil(Math.max(...all) + 1)),
    x = (i: number) => 50 + (i * 840) / Math.max(1, times.length - 1),
    y = (v: number) => 220 - ((v - lo) / (hi - lo)) * 185;
  const index = Math.min(selected ?? 0, times.length - 1);
  return (
    <>
      <div className="climate-legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="climate-plot">
        <svg viewBox="0 0 940 275" role="group" aria-label={label}>
          {Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4).map(
            (v, i) => (
              <g key={i}>
                <line
                  x1="50"
                  x2="890"
                  y1={y(v)}
                  y2={y(v)}
                  className="climate-grid"
                />
                <text x="42" y={y(v) + 4} textAnchor="end">
                  {nf(v, 1)}
                </text>
              </g>
            ),
          )}
          {series.map((s) => {
            let path = "",
              open = false;
            for (let i = 0; i < times.length; i++) {
              const v = s.values[i];
              if (v === null || !Number.isFinite(v)) {
                open = false;
                continue;
              }
              if (
                maxGapMs &&
                i > 0 &&
                Date.parse(times[i]) - Date.parse(times[i - 1]) > maxGapMs
              )
                open = false;
              path += (open ? "L" : "M") + x(i) + " " + y(v) + " ";
              open = true;
            }
            return (
              <path
                key={s.label}
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth="3"
              />
            );
          })}
          {times.map((t, i) => (
            <g key={t}>
              {i % Math.max(1, Math.ceil(times.length / 7)) === 0 && (
                <text x={x(i)} y="255" textAnchor="middle">
                  {t.length === 4 ? t : shortTime(t)}
                </text>
              )}
              <rect
                x={x(i) - 840 / Math.max(1, times.length - 1) / 2}
                y="28"
                width={840 / Math.max(1, times.length - 1)}
                height="195"
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={
                  t +
                  "; " +
                  series
                    .map((s) => s.label + " " + nf(s.values[i], 1) + " " + unit)
                    .join("; ")
                }
                onFocus={() => setSelected(i)}
                onMouseEnter={() => setSelected(i)}
                onClick={() => setSelected(i)}
              />
            </g>
          ))}
        </svg>
      </div>
      <p className="chart-readout" aria-live="polite">
        {times[index]} ·{" "}
        {series
          .map((s) => s.label + ": " + nf(s.values[index], 1) + " " + unit)
          .join(" · ")}
      </p>
    </>
  );
}
