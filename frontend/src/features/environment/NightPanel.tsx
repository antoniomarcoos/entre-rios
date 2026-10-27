import { useState } from "react";
import { useNight, nightRows } from "./queries";
import { dateTime, nf, shortTime } from "../../shared/format";
import { Panel, Status } from "../../shared/ui";
import { useApp } from "../../app/AppProvider";
export function NightPanel() {
  const [enabled, setEnabled] = useState(false),
    [hour, setHour] = useState(22),
    q = useNight(enabled),
    rows = nightRows(q.data, hour),
    { navigate } = useApp();
  return (
    <Panel
      title="Temperatura prevista à noite"
      eyebrow="COMPARAÇÃO · 123 BAIRROS"
    >
      <p>
        Compare a previsão dos pontos dos bairros. Os resultados não medem ilhas
        de calor e bairros próximos podem compartilhar a mesma célula do modelo.
      </p>
      <div className="compare-controls">
        <label>
          Horário
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
          >
            {[18, 20, 22, 0, 2, 4, 6].map((h) => (
              <option value={h} key={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
        <button
          className="refresh"
          disabled={q.status === "loading"}
          onClick={() => {
            setEnabled(true);
            if (enabled) void q.refresh();
          }}
        >
          Comparar bairros
        </button>
      </div>
      <Status status={q.status}>
        {rows.length
          ? rows.length +
            " bairros com dados para " +
            shortTime(rows[0].time) +
            " · consulta " +
            dateTime(q.checkedAt)
          : "O horário não está disponível nas próximas 24 horas."}
      </Status>
      {rows.length > 0 && (
        <div className="night-columns">
          {[
            ["Menores previsões", rows.slice(0, 5)],
            [
              "Maiores previsões",
              [...rows]
                .sort(
                  (a, b) =>
                    b.value - a.value ||
                    a.neighborhood.name.localeCompare(
                      b.neighborhood.name,
                      "pt-BR",
                    ),
                )
                .slice(0, 5),
            ],
          ].map(([title, items]) => (
            <div key={String(title)}>
              <h3>{String(title)}</h3>
              {(items as typeof rows).map((r) => (
                <div className="night-row" key={r.neighborhood.id}>
                  <span>{r.neighborhood.name}</span>
                  <strong>{nf(r.value, 1)}°</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <p>
        Para ver os pontos no mapa, abra Visão geral e ative Temperatura à
        noite.
      </p>
      <button className="refresh" onClick={() => navigate("overview")}>
        Abrir mapa
      </button>
    </Panel>
  );
}
