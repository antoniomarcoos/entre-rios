import { useState } from "react";
import {
  dayLabel,
  nf,
  uvCategory,
  value,
  type ForecastResponse,
  type Day,
} from "./data";
export function UVChart({
  week,
  day,
}: {
  week: ForecastResponse | null;
  day: Day | null;
}) {
  const [reading, setReading] = useState("");
  const points = (week?.hourly?.time || [])
    .map((time, i) => ({ time, uv: value(week?.hourly?.uv_index?.[i], 0, 30) }))
    .filter((p) => p.time.startsWith(day?.date || "no-date"));
  const top = Math.max(12, ...points.map((p) => p.uv ?? 0)),
    y = (v: number) => 200 - (v / top) * 170;
  const available = points.some((p) => p.uv !== null);
  const inspect = (time: string, uv: number | null) =>
    setReading(
      time.slice(11, 16) + " · UV " + nf(uv, 1) + " · " + uvCategory(uv),
    );
  return (
    <article className="panel extended-panel">
      <div className="eyebrow">RADIAÇÃO ULTRAVIOLETA</div>
      <h2>Índice UV ao longo do dia</h2>
      <p id="uv-summary" role="status">
        {day
          ? `${dayLabel(day.date)} · UV máximo previsto: ${nf(day.uv, 1)} · ${uvCategory(day.uv)}.`
          : "Aguardando previsão UV."}
      </p>
      <div id="uv-chart" className="climate-plot">
        {available ? (
          <svg
            viewBox="0 0 920 240"
            role="group"
            aria-label={"Índice UV por horário em " + dayLabel(day!.date)}
          >
            {Array.from(
              { length: Math.floor(top / 3) + 1 },
              (_, i) => i * 3,
            ).map((v) => (
              <g key={v}>
                <line
                  x1="40"
                  x2="900"
                  y1={y(v)}
                  y2={y(v)}
                  className="climate-grid"
                />
                <text x="25" y={y(v) + 4}>
                  {v}
                </text>
              </g>
            ))}
            {points.map((p, i) => {
              const x = 48 + (i * 850) / Math.max(1, points.length - 1),
                uv = p.uv;
              return (
                <g key={p.time}>
                  {uv !== null && (
                    <rect
                      x={x - 9}
                      y={y(uv)}
                      width="18"
                      height={200 - y(uv)}
                      rx="3"
                      fill={
                        uv < 3
                          ? "#498470"
                          : uv < 6
                            ? "#b68a42"
                            : uv < 8
                              ? "#c77b3b"
                              : uv < 11
                                ? "#bf574d"
                                : "#8e6cb0"
                      }
                      tabIndex={0}
                      role="img"
                      aria-label={p.time.slice(11, 16) + " · UV " + nf(uv, 1)}
                      onFocus={() => inspect(p.time, uv)}
                      onMouseEnter={() => inspect(p.time, uv)}
                      onClick={() => inspect(p.time, uv)}
                    >
                      <title>
                        {p.time.slice(11, 16)} · UV {nf(uv, 1)}
                      </title>
                    </rect>
                  )}
                  {i % 3 === 0 && (
                    <text x={x} y="225" textAnchor="middle">
                      {p.time.slice(11, 16)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ) : day ? (
          "Sem previsão UV por horário para este dia."
        ) : null}
      </div>
      {available && (
        <p className="uv-readout" aria-live="polite">
          {reading || "Toque nas barras ou use Tab para conferir cada horário."}
        </p>
      )}
      <p className="uv-key">
        Baixo: 0–2 · Moderado: 3–5 · Alto: 6–7 · Muito alto: 8–10 · Extremo: 11
        ou mais.
      </p>
      <small>
        Previsão do conjunto padrão do Open-Meteo, separada da comparação entre
        modelos. Umidade e temperatura não determinam o índice UV.
      </small>
      <p>
        <a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener">
          Fonte e documentação da previsão ↗
        </a>
      </p>
    </article>
  );
}
