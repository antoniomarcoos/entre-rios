import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import { climateSchema, type Climate } from "../../shared/schemas";
import { nf, dateTime, localDate } from "../../shared/format";
import { Panel, Status, Table, ExternalLink } from "../../shared/ui";
import { LineChart } from "../../shared/LineChart";
const months = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
const signed = (v: number | null) =>
  v === null ? "—" : (v > 0 ? "+" : "") + nf(v, 2);
function Monthly({ data, year }: { data: Climate; year: number }) {
  const rows = months.map(
      (_, i) =>
        data.monthly.find((r) => r.year === year && r.month === i + 1) || {
          year,
          month: i + 1,
          mean: null,
          reference: data.baseline[i].mean,
          anomaly: null,
          provisional: false,
        },
    ),
    limit = Math.max(
      1,
      Math.ceil(Math.max(...rows.map((r) => Math.abs(r.anomaly || 0)))),
    ),
    y = (v: number) => 148 - (v / limit) * 105;
  return (
    <>
      <div className="climate-plot">
        <svg
          viewBox="0 0 940 310"
          role="img"
          aria-label={
            "Diferenças mensais de temperatura em " +
            year +
            " em relação a 1991 a 2020"
          }
        >
          {Array.from({ length: limit * 2 + 1 }, (_, i) => i - limit).map(
            (v) => (
              <g key={v}>
                <line
                  x1="54"
                  x2="917"
                  y1={y(v)}
                  y2={y(v)}
                  className="climate-grid"
                />
                <text x="43" y={y(v) + 4} textAnchor="end">
                  {v} °C
                </text>
              </g>
            ),
          )}
          {rows.map((r, i) => (
            <g key={r.month}>
              {r.anomaly !== null ? (
                <rect
                  x={72 + i * 71}
                  y={Math.min(148, y(r.anomaly))}
                  width="38"
                  height={Math.max(0.6, Math.abs(y(r.anomaly) - 148))}
                  rx="3"
                  fill={r.anomaly >= 0 ? "#bd5c48" : "#4e8ca9"}
                >
                  <title>
                    {months[i]}: {signed(r.anomaly)} °C
                  </title>
                </rect>
              ) : (
                <text x={91 + i * 71} y="143" textAnchor="middle">
                  —
                </text>
              )}
              <text x={91 + i * 71} y="285" textAnchor="middle">
                {months[i]}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p>
        Vermelho: acima da referência · Azul: abaixo da referência · Sem barra:
        sem dado.
      </p>
      <Table
        caption={
          "Ano " +
          year +
          " · valores em °C · referência calculada na mesma reanálise"
        }
        headers={["Mês", "Temperatura", "Referência", "Diferença", "Situação"]}
        rows={rows.map((r) => [
          months[r.month - 1],
          nf(r.mean, 2),
          nf(r.reference, 2),
          signed(r.anomaly),
          String(year) + "-" + String(r.month).padStart(2, "0") >=
          localDate().slice(0, 7)
            ? "Mês ainda não encerrado"
            : r.mean === null
              ? "Sem dado"
              : r.reference === null
                ? "Referência incompleta"
                : r.provisional
                  ? "Provisório · pode ser revisado"
                  : "Publicado",
        ])}
      />
    </>
  );
}
export default function ClimateView() {
  const { revision } = useApp(),
    q = useQuery(
      "climate",
      (s) => json("/api/climate", climateSchema, s, 60000),
      { ttl: 86400000, revision },
    ),
    d = q.data,
    [choice, setChoice] = useState(0),
    years = d ? [...new Set(d.monthly.map((r) => r.year))].reverse() : [],
    year = years.includes(choice) ? choice : years[0],
    complete = d?.annual.filter((r) => r.mean !== null) || [],
    last = d?.monthly.filter((r) => r.mean !== null).at(-1);
  const trend = d?.trend_per_decade ?? null,
    mx =
      complete.reduce((s, r) => s + r.year, 0) / Math.max(1, complete.length),
    my =
      complete.reduce((s, r) => s + (r.mean || 0), 0) /
      Math.max(1, complete.length);
  return (
    <>
      <Panel
        title="Como o clima vem mudando"
        eyebrow="TERESINA AO LONGO DOS ANOS"
        action={
          <button
            className="refresh"
            disabled={q.status === "loading"}
            onClick={() => void q.refresh()}
          >
            {q.status === "loading"
              ? "Consultando histórico…"
              : "Atualizar histórico"}
          </button>
        }
      >
        <p>
          Uma série regional de temperatura desde 1981, com comparação mês a
          mês.
        </p>
        <div className="climate-source-note">
          <strong>NASA POWER · reanálise MERRA-2</strong>
          <p>
            Esta série combina observações e modelagem em uma grade de 0,5° ×
            0,625°, cerca de 55 × 69 km nesta latitude. Representa a região de
            Teresina, sem distinguir bairros. Não é uma série medida em estação
            do INMET.
          </p>
        </div>
        <Status status={q.status}>
          {d?.saved_copy
            ? "Histórico salvo: a NASA não respondeu a esta consulta. "
            : ""}
          Dados até{" "}
          {last ? String(last.month).padStart(2, "0") + "/" + last.year : "—"} ·
          fonte consultada em {dateTime(d?.checked_at)}.
        </Status>
      </Panel>
      <div className="climate-metrics">
        {[
          [
            "PERÍODO ANALISADO",
            d?.trend_period.join("–") || "—",
            "Somente anos com os 12 meses disponíveis.",
          ],
          [
            "TENDÊNCIA LINEAR DESCRITIVA",
            signed(trend),
            "°C por década. Não atribui causas ao aquecimento.",
          ],
          [
            "REFERÊNCIA DE COMPARAÇÃO",
            "1991–2020",
            "Média calculada nesta mesma série.",
          ],
        ].map(([title, value, desc]) => (
          <Panel key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
            <p>{desc}</p>
          </Panel>
        ))}
      </div>
      <Panel
        title="Temperatura média por ano"
        action={
          <a
            className="refresh download-link"
            href={d ? "/api/climate?format=csv" : undefined}
            aria-disabled={!d}
            download="teresina-nasa-power-temperatura-mensal.csv"
          >
            Baixar CSV
          </a>
        }
      >
        <p>
          Média mensal ponderada pelo número de dias. Linha dourada: ajuste
          linear descritivo.
        </p>
        <LineChart
          times={d?.annual.map((r) => String(r.year)) || []}
          series={[
            {
              label: "Temperatura média",
              color: "#498470",
              values: d?.annual.map((r) => r.mean) || [],
            },
            {
              label: "Ajuste linear",
              color: "#b68a42",
              values:
                d?.annual.map((r) =>
                  trend === null ? null : my + ((r.year - mx) * trend) / 10,
                ) || [],
            },
          ]}
          unit="°C"
          label="Temperatura média anual da reanálise regional NASA POWER"
        />
      </Panel>
      <Panel
        title="Mais quente que a referência?"
        action={
          <label>
            Ano
            <select
              value={year || ""}
              onChange={(e) => setChoice(Number(e.target.value))}
              disabled={!years.length}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        }
      >
        <p>
          Diferença de cada mês em relação à média do mesmo mês em 1991–2020.
        </p>
        {d && year && <Monthly data={d} year={year} />}
      </Panel>
      <Panel title="Como ler estes dados">
        <p>
          A referência mensal exige os 30 valores de 1991 a 2020. Mês ausente
          não vira zero. Anos incompletos ficam fora da tendência, assim como o
          mês em andamento na comparação mensal.
        </p>
        <p>
          Os três meses mais recentes podem ser revisados pelo provedor. A
          tendência descreve esta reanálise regional, sem teste de significância
          ou atribuição causal. Não mede isoladamente o efeito do aquecimento
          global ou da ilha de calor urbana.
        </p>
        {d && (
          <p>
            Ponto consultado: {d.point.latitude}, {d.point.longitude} · meses
            sem valor: {d.missing_months} · anos completos: {complete.length}.
          </p>
        )}
        <p>
          A consulta do servidor é renovada no máximo uma vez por dia. A NASA
          pode publicar novos meses em intervalos maiores.
        </p>
        <ExternalLink href="https://power.larc.nasa.gov/docs/services/api/temporal/monthly/">
          Documentação NASA POWER
        </ExternalLink>
      </Panel>
      <Panel
        title="O Pacífico também faz parte da história"
        eyebrow="EL NIÑO E LA NIÑA"
      >
        <p>
          Consulte a fase e as perspectivas nos boletins oficiais. Uma previsão
          para o trimestre não determina o tempo em cada bairro nem explica
          sozinha a tendência de décadas.
        </p>
        <ExternalLink href="https://clima2.cptec.inpe.br/enos">
          Consultar monitoramento do CPTEC/INPE
        </ExternalLink>
      </Panel>
    </>
  );
}
