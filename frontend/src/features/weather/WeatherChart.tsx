import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { LineChart, type ChartSeries } from "../../shared/LineChart";
import { Panel } from "../../shared/ui";
export function WeatherChart() {
  const { weather, neighborhood } = useApp(),
    [range, setRange] = useState(24),
    [mode, setMode] = useState<"temperature" | "rain" | "wind">("temperature");
  const h = weather.data?.hourly,
    cut = weather.data?.current.time.slice(0, 13) + ":00";
  const indexes =
    h?.time
      .map((t, i) => ({ t, i }))
      .filter((p) => p.t >= cut)
      .slice(0, range) || [];
  const config = {
    temperature: {
      keys: ["temperature_2m", "apparent_temperature"] as const,
      labels: ["Temperatura", "Sensação"],
      unit: "°C",
    },
    rain: {
      keys: ["precipitation_probability"] as const,
      labels: ["Chance de chuva"],
      unit: "%",
    },
    wind: {
      keys: ["wind_speed_10m", "wind_gusts_10m"] as const,
      labels: ["Vento", "Rajadas"],
      unit: "km/h",
    },
  }[mode];
  const series: ChartSeries[] = config.keys.map((key, i) => ({
    label: config.labels[i],
    color: i ? "#b68a42" : "#498470",
    values: indexes.map((p) => h?.[key]?.[p.i] ?? null),
  }));
  return (
    <Panel
      title="Como o tempo vai mudar"
      eyebrow="DE OLHO NAS PRÓXIMAS HORAS"
      action={
        <div className="range-switch">
          {[12, 24].map((n) => (
            <button
              key={n}
              aria-pressed={range === n}
              onClick={() => setRange(n)}
            >
              {n}h
            </button>
          ))}
        </div>
      }
    >
      <p>{neighborhood.name} · Teresina</p>
      <div className="chart-tabs">
        {(["temperature", "rain", "wind"] as const).map((m, i) => (
          <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {["Temperatura", "Chuva", "Vento"][i]}
          </button>
        ))}
      </div>
      <LineChart
        times={indexes.map((p) => p.t)}
        series={series}
        unit={config.unit}
        label={config.labels.join(" e ") + " nas próximas " + range + " horas"}
        zero={mode !== "temperature"}
      />
    </Panel>
  );
}
