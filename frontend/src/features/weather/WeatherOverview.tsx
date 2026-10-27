import { useApp } from "../../app/AppProvider";
import { nf, shortTime, weatherDescription } from "../../shared/format";
import { Panel, Table, Status, SourceAge } from "../../shared/ui";
import { WeatherChart } from "./WeatherChart";
export function WeatherStatus() {
  const { weather, neighborhood } = useApp();
  return (
    <>
      <Status status={weather.status}>
        {neighborhood.name} · Open-Meteo · dados de previsão para o ponto do
        bairro.
      </Status>
      {weather.data && (
        <SourceAge
          reference={weather.data.current.time}
          checkedAt={
            weather.checkedAt
              ? new Date(weather.checkedAt).toISOString()
              : undefined
          }
        />
      )}
    </>
  );
}
export function WeatherOverview() {
  const { weather, navigate } = useApp(),
    c = weather.data?.current,
    h = weather.data?.hourly;
  const upcoming =
    h?.time
      .map((t, i) => ({ t, i }))
      .filter((p) => p.t >= c?.time.slice(0, 13) + ":00")
      .slice(0, 24) || [];
  return (
    <>
      <div className="metrics">
        {[
          {
            title: "TEMPERATURA DO AR",
            value: c?.temperature_2m,
            unit: "°C",
            desc: c ? weatherDescription(c.weather_code) : "Aguardando dados",
          },
          {
            title: "SENSAÇÃO TÉRMICA",
            value: c?.apparent_temperature,
            unit: "°C",
            desc: "Valor calculado pelo provedor",
          },
          {
            title: "UMIDADE RELATIVA",
            value: c?.relative_humidity_2m,
            unit: "%",
            desc: "Umidade do ar estimada",
          },
          {
            title: "VENTO",
            value: c?.wind_speed_10m,
            unit: "km/h",
            desc: "Velocidade a 10 m de altura",
          },
        ].map((m, i) => (
          <article
            className={"metric " + (i === 0 ? "primary" : "")}
            key={m.title}
          >
            <div className="metric-label">{m.title}</div>
            <div className="big">
              {nf(m.value)}
              <small>{m.unit}</small>
            </div>
            <p>{m.desc}</p>
            <small>Estimativa meteorológica · Open-Meteo</small>
          </article>
        ))}
      </div>
      <WeatherChart />
      <Panel title="Vale ficar de olho" eyebrow="RESUMO · PRÓXIMAS 24H">
        <div className="week-detail">
          {[
            ["Maior temperatura", "temperature_2m", -1, "°C"],
            ["Menor temperatura", "temperature_2m", 1, "°C"],
            ["Maior chance de chuva", "precipitation_probability", -1, "%"],
          ].map(([label, key, direction, unit]) => {
            const arr =
              key === "temperature_2m"
                ? h?.temperature_2m
                : h?.precipitation_probability;
            const points = upcoming
              .filter((p) => typeof arr?.[p.i] === "number")
              .sort((a, b) => (arr![a.i]! - arr![b.i]!) * Number(direction));
            const p = points[0];
            return (
              <div key={String(label)}>
                <span>{label}</span>
                <strong>
                  {nf(p ? arr?.[p.i] : null)} {unit}
                </strong>
                <small>{p ? shortTime(p.t) : "Aguardando previsão"}</small>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel
        title="Nas próximas horas"
        action={
          <button className="refresh" onClick={() => navigate("forecast")}>
            Ver previsão completa →
          </button>
        }
      >
        <div
          className="hours"
          role="region"
          aria-label="Previsão por hora"
          tabIndex={0}
        >
          {upcoming.map((p) => (
            <div className="hour" key={p.t}>
              <time dateTime={p.t + "-03:00"}>
                <span>{p.t.slice(11, 16)}</span>
                <small>
                  {p.t.slice(8, 10)}/{p.t.slice(5, 7)}
                </small>
              </time>
              <strong>{nf(h?.temperature_2m[p.i])}°</strong>
              <div className="rain">
                Chuva {nf(h?.precipitation_probability?.[p.i])}%
              </div>
            </div>
          ))}
        </div>
        {!upcoming.length && (
          <Status status={weather.status}>
            Sem previsão por hora disponível.
          </Status>
        )}
      </Panel>
    </>
  );
}
export function HourlyForecast() {
  const { weather } = useApp(),
    d = weather.data,
    h = d?.hourly;
  const points =
    h?.time
      .map((t, i) => ({ t, i }))
      .filter((p) => p.t >= d?.current.time.slice(0, 13) + ":00")
      .slice(0, 24) || [];
  return (
    <Panel title="Próximas 24 horas">
      <p>
        Estimativa para o local escolhido. Chuva localizada pode passar
        despercebida pelo modelo.
      </p>
      <Table
        headers={[
          "Horário",
          "Ar",
          "Sensação",
          "Umidade",
          "Chuva",
          "Vento / rajada",
          "UV",
        ]}
        rows={points.map((p) => [
          shortTime(p.t),
          nf(h?.temperature_2m[p.i]) + "°",
          nf(h?.apparent_temperature?.[p.i]) + "°",
          nf(h?.relative_humidity_2m?.[p.i]) + "%",
          nf(h?.precipitation_probability?.[p.i]) + "%",
          nf(h?.wind_speed_10m?.[p.i]) +
            " / " +
            nf(h?.wind_gusts_10m?.[p.i]) +
            " km/h",
          nf(h?.uv_index?.[p.i], 1),
        ])}
      />
    </Panel>
  );
}
