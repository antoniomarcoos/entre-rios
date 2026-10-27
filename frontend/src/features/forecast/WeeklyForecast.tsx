import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import { seriesSchema } from "../../shared/schemas";
import { daily, forecastURLs, type ForecastResponse } from "./data";

import { checkedLabel, dayLabel, nf } from "./data";
import { ModelComparison } from "./ModelComparison";
import { UVChart } from "./UVChart";
export function WeeklyForecast() {
  const { neighborhood, revision } = useApp();
  const location = { ...neighborhood };
  const active = true;
  const urls = forecastURLs(location);
  const q = useQuery(
    "week:" + location.id,
    (s) => json(urls.week, seriesSchema, s),
    { ttl: 900000, revision },
  );
  const m = useQuery(
    "models:" + location.id,
    (s) => json(urls.models, seriesSchema, s),
    { ttl: 900000, revision },
  );
  const refresh = () => {
    void q.refresh();
    void m.refresh();
  };
  const ready = q.data
    ? {
        status: "ready" as const,
        days: daily(q.data as ForecastResponse),
        week: q.data as ForecastResponse,
        models: (m.data as ForecastResponse) || null,
        modelError: m.status === "error",
        checkedAt: q.checkedAt!,
      }
    : null;
  const [selectedDate, setSelectedDate] = useState("");
  const day =
    ready?.days.find((d) => d.date === selectedDate) ?? ready?.days[0] ?? null;
  const status = ready
    ? `${location?.name} · Open-Meteo · consulta ${checkedLabel(ready.checkedAt)}. Horários de Teresina. Atualização da consulta a cada 15 min nesta aba.`
    : q.status === "error"
      ? "A previsão de sete dias não carregou. Tente novamente."
      : !active
        ? "A previsão carrega ao abrir esta aba."
        : `Consultando os próximos sete dias para ${location?.name || "o bairro"}…`;
  return (
    <>
      <article className="panel extended-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">PREVISÃO PARA O BAIRRO</div>
            <h2>Os próximos sete dias</h2>
            <p>
              Escolha um dia para ver os detalhes, os modelos e o índice UV.
            </p>
          </div>
          <button
            id="week-refresh"
            className="refresh"
            disabled={active && q.status === "loading"}
            onClick={refresh}
          >
            Atualizar semana
          </button>
        </div>
        <p id="week-status" role="status">
          {status}
        </p>
        <div id="week-days" className="week-days" aria-label="Dia da previsão">
          {ready?.days.map((d) => (
            <button
              type="button"
              key={d.date}
              data-date={d.date}
              aria-pressed={d.date === day?.date}
              onClick={() => setSelectedDate(d.date)}
            >
              <span>{dayLabel(d.date)}</span>
              <strong>
                {nf(d.max)}° / {nf(d.min)}°
              </strong>
              <small>{nf(d.rain, 1)} mm</small>
            </button>
          ))}
        </div>
        <div id="week-detail" className="week-detail">
          {day &&
            [
              { label: "Máxima", value: day.max, unit: "°C" },
              { label: "Mínima", value: day.min, unit: "°C" },
              { label: "Chuva no dia", value: day.rain, unit: "mm" },
              { label: "Rajada máxima", value: day.gust, unit: "km/h" },
            ].map((d) => (
              <div key={d.label}>
                <span>{d.label}</span>
                <strong>
                  {nf(d.value, 1)} {d.unit}
                </strong>
              </div>
            ))}
        </div>
      </article>
      <ModelComparison
        data={ready?.models ?? null}
        date={day?.date ?? ""}
        modelError={ready?.modelError ?? false}
      />
      <UVChart
        key={(location?.id || "") + (day?.date || "")}
        week={ready?.week ?? null}
        day={day}
      />
    </>
  );
}
