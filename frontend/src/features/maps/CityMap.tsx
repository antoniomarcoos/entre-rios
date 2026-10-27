import { useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { MapCanvas, type MapArea, type MapPoint } from "./MapCanvas";
import { useFires, useNight, nightRows } from "../environment/queries";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import { floodSchema } from "../../shared/schemas";
import { dateTime, nf, shortTime } from "../../shared/format";
import { Panel, Status } from "../../shared/ui";
const landmarks: MapPoint[] = [
  {
    latitude: -5.0088,
    longitude: -42.8535,
    label: "Encontro dos Rios",
    color: "#498470",
  },
  {
    latitude: -5.0892,
    longitude: -42.8019,
    label: "Centro de Teresina",
    color: "#498470",
  },
  {
    latitude: -5.0804,
    longitude: -42.7871,
    label: "Parque Potycabana",
    color: "#498470",
  },
  {
    latitude: -5.069,
    longitude: -42.785,
    label: "Ponte Estaiada",
    color: "#498470",
  },
  {
    latitude: -5.055,
    longitude: -42.787,
    label: "UFPI · campus Petrônio Portella",
    color: "#498470",
  },
];
export function CityMap() {
  const { neighborhood, revision } = useApp(),
    [fires, setFires] = useState(false),
    [flood, setFlood] = useState(false),
    [scenario, setScenario] = useState("3"),
    [night, setNight] = useState(false),
    [hour, setHour] = useState(22);
  const fire = useFires(fires),
    nightQuery = useNight(night),
    floodQuery = useQuery(
      "flood:" + scenario,
      (s) => json("/api/environment?kind=flood-" + scenario, floodSchema, s),
      { enabled: flood, ttl: 86400000, revision },
    );
  const rows = useMemo(
    () => nightRows(nightQuery.data, hour),
    [nightQuery.data, hour],
  );
  const points = useMemo(() => {
    const p = [
      ...landmarks,
      {
        latitude: neighborhood.latitude,
        longitude: neighborhood.longitude,
        label: neighborhood.name + " · referência para a previsão",
        color: "#b39853",
        radius: 11,
      },
    ];
    if (fires && fire.data)
      for (const f of fire.data.detections)
        p.push({
          latitude: f.lat,
          longitude: f.lon,
          label: "Detecção INPE · " + f.satellite + " · " + dateTime(f.time),
          color: "#ce743c",
          radius: 7,
        });
    if (night && rows.length) {
      const min = Math.min(...rows.map((r) => r.value)),
        max = Math.max(...rows.map((r) => r.value));
      for (const r of rows)
        p.push({
          latitude: r.neighborhood.latitude,
          longitude: r.neighborhood.longitude,
          label:
            r.neighborhood.name +
            " · " +
            nf(r.value, 1) +
            " °C · " +
            shortTime(r.time) +
            " · previsão",
          color: `hsl(${190 - (max === min ? 0.5 : (r.value - min) / (max - min)) * 155} 45% 48%)`,
          radius: 6,
        });
    }
    return p;
  }, [neighborhood, fires, fire.data, night, rows]);
  const areas = useMemo<MapArea[]>(
    () =>
      flood && floodQuery.data
        ? floodQuery.data.features.map((f) => ({
            geometry: f.geometry,
            color: "#498ead",
            label:
              "Cenário SGB · tempo de retorno " +
              f.properties.TR_ANO +
              " anos. Não é uma previsão para hoje.",
          }))
        : [],
    [flood, floodQuery.data],
  );
  return (
    <Panel title="Explore Teresina">
      <p>
        O ponto dourado acompanha o bairro escolhido. Os demais marcadores
        mostram locais de referência.
      </p>
      <div className="map-controls">
        <label>
          <input
            type="checkbox"
            checked={fires}
            onChange={(e) => setFires(e.target.checked)}
          />
          Focos INPE
        </label>
        <label>
          <input
            type="checkbox"
            checked={flood}
            onChange={(e) => setFlood(e.target.checked)}
          />
          Inundação · cenário
        </label>
        <label>
          Tempo de retorno
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          >
            {[
              ["3", "2 anos"],
              ["4", "5 anos"],
              ["5", "10 anos"],
            ].map(([v, t]) => (
              <option value={v} key={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={night}
            onChange={(e) => setNight(e.target.checked)}
          />
          Temperatura à noite
        </label>
        {night && (
          <label>
            Horário
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
            >
              {[18, 20, 22, 0, 2, 4, 6].map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {fires && (
        <Status status={fire.status}>
          {fire.data?.detections.length} detecções de satélite em 24h · consulta{" "}
          {dateTime(fire.data?.checked_at)}. Várias detecções podem pertencer ao
          mesmo incêndio.
        </Status>
      )}
      {flood && (
        <Status status={floodQuery.status}>
          Cenário SGB consultado em {dateTime(floodQuery.data?.retrieved_at)}.
          Não indica inundação atual nem todo o risco de alagamento urbano.
        </Status>
      )}
      {night && (
        <Status status={nightQuery.status}>
          {rows.length
            ? "Temperatura prevista · " +
              shortTime(rows[0].time) +
              " · " +
              rows.length +
              " pontos."
            : "Sem valores para o horário escolhido."}
        </Status>
      )}
      <MapCanvas
        latitude={neighborhood.latitude}
        longitude={neighborhood.longitude}
        points={points}
        areas={areas}
      />
      <p>
        © OpenStreetMap contributors · Focos em laranja · Cenário fluvial em
        azul · Pontos noturnos do azul ao dourado.
      </p>
    </Panel>
  );
}
