import { useState } from "react";
import { neighborhoods, useApp } from "../../app/AppProvider";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import { pointsSchema } from "../../shared/schemas";
import { nf, dateTime, shortTime } from "../../shared/format";
import { Panel, Status, Table } from "../../shared/ui";
import { LineChart } from "../../shared/LineChart";
export default function CompareView() {
  const { revision } = useApp(),
    [a, setA] = useState("centro"),
    [b, setB] = useState("ininga"),
    [c, setC] = useState(""),
    [selected, setSelected] = useState(""),
    ids = [a, b, c].filter(Boolean),
    valid = new Set(ids).size === ids.length,
    places = ids.map((id) => neighborhoods.find((n) => n.id === id)!),
    url =
      "https://api.open-meteo.com/v1/forecast?" +
      new URLSearchParams({
        latitude: places.map((n) => n.latitude).join(","),
        longitude: places.map((n) => n.longitude).join(","),
        hourly:
          "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation",
        forecast_hours: "25",
        timezone: "America/Fortaleza",
      }),
    q = useQuery(
      "compare:" + ids.join(","),
      async (s) => {
        const data = await json(url, pointsSchema, s);
        if (data.length !== ids.length) throw Error("Resposta incompleta");
        return data;
      },
      { enabled: valid, revision },
    ),
    points = valid ? q.data : undefined,
    times =
      points?.[0].hourly.time.filter((t) =>
        points.every((p) => p.hourly.time.includes(t)),
      ) || [],
    time = times.includes(selected) ? selected : times[0] || "";
  return (
    <Panel title="Compare dois ou três bairros" eyebrow="PREVISÃO · OPEN-METEO">
      <p>
        Os pontos podem compartilhar a mesma célula do modelo e apresentar
        valores iguais. A comparação mostra previsão, não medições de sensores
        nos bairros.
      </p>
      <div className="compare-controls">
        {[
          { label: "Primeiro bairro", value: a, set: setA },
          { label: "Segundo bairro", value: b, set: setB },
          { label: "Terceiro bairro", value: c, set: setC },
        ].map((s, i) => (
          <label key={s.label}>
            {s.label}
            <select value={s.value} onChange={(e) => s.set(e.target.value)}>
              {i === 2 && <option value="">Sem terceiro bairro</option>}
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          className="refresh"
          disabled={!valid || q.status === "loading"}
          onClick={() => void q.refresh()}
        >
          Atualizar comparação
        </button>
      </div>
      {!valid ? (
        <p role="status">Escolha bairros diferentes para comparar.</p>
      ) : (
        <Status status={q.status}>
          Open-Meteo · consulta {dateTime(q.checkedAt)}.{" "}
          {points &&
          new Set(points.map((p) => p.latitude + "," + p.longitude)).size <
            points.length
            ? "Há bairros com a mesma coordenada de grade retornada pelo modelo."
            : "Previsões para pontos internos aos bairros."}
        </Status>
      )}
      <label>
        Horário
        <select
          value={time}
          onChange={(e) => setSelected(e.target.value)}
          disabled={!times.length}
        >
          {times.map((t) => (
            <option value={t} key={t}>
              {shortTime(t)}
            </option>
          ))}
        </select>
      </label>
      <Table
        headers={[
          "Bairro",
          "Temperatura",
          "Umidade",
          "Chance de chuva",
          "Chuva prevista",
        ]}
        rows={
          points?.map((p, j) => {
            const i = p.hourly.time.indexOf(time);
            return [
              places[j].name,
              nf(p.hourly.temperature_2m[i], 1) + " °C",
              nf(p.hourly.relative_humidity_2m?.[i]) + " %",
              nf(p.hourly.precipitation_probability?.[i]) + " %",
              nf(p.hourly.precipitation?.[i], 1) + " mm",
            ];
          }) || []
        }
      />
      <h3>Temperatura nas próximas 24 horas</h3>
      <LineChart
        times={times}
        series={
          points?.map((p, j) => ({
            label: places[j].name,
            color: ["#498470", "#b68a42", "#8674af"][j],
            values: times.map(
              (t) => p.hourly.temperature_2m[p.hourly.time.indexOf(t)] ?? null,
            ),
          })) || []
        }
        unit="°C"
        label="Comparação da temperatura prevista dos bairros"
      />
    </Panel>
  );
}
