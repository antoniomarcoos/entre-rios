import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import {
  airSchema,
  gaugesSchema,
  waterSchema,
  riverSchema,
} from "../../shared/schemas";
import { nf, dateTime } from "../../shared/format";
import { Panel, Status, Table, SourceAge, ExternalLink } from "../../shared/ui";
import { LineChart } from "../../shared/LineChart";
import { useFires } from "./queries";
import { NightPanel } from "./NightPanel";
function RainGauges() {
  const { revision } = useApp(),
    q = useQuery("gauges", (s) => json("/api/rain-gauges", gaugesSchema, s), {
      ttl: 900000,
      revision,
    }),
    d = q.data;
  return (
    <Panel
      title="Quanto choveu nos pluviômetros?"
      eyebrow="CHUVA MEDIDA · CEMADEN"
      action={
        <button
          className="refresh"
          onClick={() => void q.refresh()}
          disabled={q.status === "loading"}
        >
          Consultar pluviômetros
        </button>
      }
    >
      <p>Acumulado de 24 horas publicado pela rede em Teresina.</p>
      <Status status={q.status}>
        {d?.available
          ? (d.stale ? "Arquivo antigo. " : "") +
            "Arquivo atualizado em " +
            dateTime(d.reference) +
            " · consulta " +
            dateTime(d.checked_at)
          : d?.reason}
      </Status>
      <Table
        headers={["Estação", "Código", "Acumulado · 24h", "Disponibilidade"]}
        rows={
          d?.stations.map((s) => [
            s.name,
            s.code,
            nf(s.rain_mm, 1) + " mm",
            !s.active
              ? "Inativa na fonte"
              : s.rain_mm === null
                ? "Sem leitura no arquivo"
                : d.stale
                  ? "Valor em arquivo antigo"
                  : "Valor disponível",
          ]) || []
        }
      />
      <p>
        A fonte informa a atualização do arquivo da rede, sem o horário
        individual de transmissão ou garantia de cobertura completa das 24
        horas. Um zero publicado não comprova ausência de chuva em toda a
        cidade.
      </p>
      <ExternalLink href="https://mapainterativo.cemaden.gov.br/">
        Conferir mapa e gráficos oficiais
      </ExternalLink>
    </Panel>
  );
}
function AirPanel() {
  const { neighborhood: n, revision } = useApp(),
    u =
      "https://air-quality-api.open-meteo.com/v1/air-quality?" +
      new URLSearchParams({
        latitude: String(n.latitude),
        longitude: String(n.longitude),
        current: "pm2_5,pm10,ozone,nitrogen_dioxide",
        hourly: "pm2_5,pm10",
        domains: "cams_global",
        timezone: "America/Fortaleza",
        forecast_days: "2",
      }),
    q = useQuery("air:" + n.id, (s) => json(u, airSchema, s), {
      ttl: 900000,
      revision,
    }),
    c = q.data?.current,
    h = q.data?.hourly,
    indexes =
      h?.time
        .map((t, i) => ({ t, i }))
        .filter((p) => p.t >= c?.time.slice(0, 13) + ":00")
        .slice(0, 24) || [];
  return (
    <Panel title="Qualidade do ar prevista" eyebrow="CAMS GLOBAL · OPEN-METEO">
      <p>
        Previsão regional em uma grade de cerca de 45 km. Não é medição de
        sensor no bairro nem diagnóstico de saúde.
      </p>
      <Status status={q.status}>{n.name} · modelo CAMS</Status>
      {c && (
        <SourceAge
          reference={c.time}
          checkedAt={
            q.checkedAt ? new Date(q.checkedAt).toISOString() : undefined
          }
        />
      )}
      <div className="station-values">
        {[
          ["PM2,5", c?.pm2_5],
          ["PM10", c?.pm10],
          ["Ozônio", c?.ozone],
          ["NO₂", c?.nitrogen_dioxide],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>
              {nf(value, 1)} <small>µg/m³</small>
            </strong>
          </div>
        ))}
      </div>
      <LineChart
        times={indexes.map((p) => p.t)}
        series={[
          {
            label: "PM2,5",
            color: "#498470",
            values: indexes.map((p) => h?.pm2_5[p.i] ?? null),
          },
          {
            label: "PM10",
            color: "#b68a42",
            values: indexes.map((p) => h?.pm10[p.i] ?? null),
          },
        ]}
        unit="µg/m³"
        label="Poluentes previstos nas próximas 24 horas"
        zero
      />
    </Panel>
  );
}
function FiresPanel() {
  const q = useFires(true),
    d = q.data;
  return (
    <Panel
      title="Focos detectados por satélite"
      eyebrow="INPE · JANELA DE 24 HORAS"
    >
      <Status status={q.status}>
        {d?.detections.length} detecções em Teresina · janela{" "}
        {dateTime(d?.start)} a {dateTime(d?.end)} · consulta{" "}
        {dateTime(d?.checked_at)} · última detecção nacional nos arquivos{" "}
        {dateTime(d?.latest)}.
      </Status>
      <p>
        Uma detecção não equivale a um incêndio distinto. Falha da fonte não
        significa ausência de focos.
      </p>
      {d?.detections.length === 0 && (
        <p>Nenhuma detecção para Teresina na janela consultada.</p>
      )}
      <Table
        headers={["Horário de Teresina", "Satélite"]}
        rows={
          d?.detections
            .slice(0, 20)
            .map((f) => [dateTime(f.time), f.satellite]) || []
        }
      />
      <ExternalLink href="https://terrabrasilis.dpi.inpe.br/queimadas/portal/">
        Consultar programa Queimadas
      </ExternalLink>
    </Panel>
  );
}
function WaterPanel() {
  const { revision } = useApp(),
    q = useQuery(
      "water",
      (s) => json("/api/environment?kind=water", waterSchema, s),
      { ttl: 900000, revision },
    ),
    d = q.data;
  return (
    <Panel title="Qualidade da água dos rios" eyebrow="COLETAS · SEMARH">
      <Status status={q.status}>
        Fonte consultada em {dateTime(d?.retrieved_at)} · {d?.stations.length}{" "}
        estações em Teresina.
      </Status>
      {d && (
        <SourceAge
          reference={d.stations
            .map((s) =>
              s.dataColeta.replace(" ", "T").replace(/-03$/, "-03:00"),
            )
            .sort()
            .at(-1)}
          checkedAt={d.retrieved_at}
          maxAge={30 * 86400000}
        />
      )}
      <p>
        A data de coleta é a referência da medição. Uma consulta recente pode
        trazer coletas antigas. Os parâmetros isolados não confirmam
        potabilidade nem condições para banho.
      </p>
      <Table
        headers={[
          "Estação / rio",
          "Coleta",
          "pH",
          "Oxigênio · mg/L",
          "Turbidez · UNT",
          "IQA",
        ]}
        rows={
          d?.stations.map((s) => [
            s.nome + " · " + s.corpoHidrico,
            dateTime(s.dataColeta.replace(" ", "T").replace(/-03$/, "-03:00")),
            nf(s.ph, 2),
            nf(s.odMgL, 2),
            nf(s.turbidez, 2),
            s.iqa === null ? "Não publicado" : nf(s.iqa),
          ]) || []
        }
      />
      <ExternalLink href="https://www.semarh.pi.gov.br/qualidade-agua">
        Abrir monitor oficial da água
      </ExternalLink>
    </Panel>
  );
}
function RiverPanel() {
  const { revision } = useApp(),
    [station, setStation] = useState("chesf"),
    q = useQuery(
      "river:" + station,
      (s) => json("/api/environment?kind=river-" + station, riverSchema, s),
      { revision },
    ),
    d = q.data,
    last = d?.readings.at(-1);
  return (
    <Panel title="Nível dos rios" eyebrow="COTA DA RÉGUA · SGB">
      <label>
        Estação
        <select value={station} onChange={(e) => setStation(e.target.value)}>
          <option value="chesf">Parnaíba · Teresina CHESF</option>
          <option value="cantinho">Poti · Fazenda Cantinho II</option>
        </select>
      </label>
      <Status status={q.status}>
        {d?.station} · última leitura {nf(last?.value, 1)} cm em{" "}
        {dateTime(last?.time)} · consulta {dateTime(d?.retrieved_at)}.
      </Status>
      {last && (
        <SourceAge
          reference={last.time}
          checkedAt={d?.retrieved_at}
          maxAge={10800000}
        />
      )}
      <p>
        Cota em centímetros em relação à régua da estação. Não é a profundidade
        do rio e não determina sozinha um alerta de inundação.
      </p>
      <LineChart
        times={d?.readings.map((p) => p.time) || []}
        series={[
          {
            label: "Cota",
            color: "#4e8ca9",
            values: d?.readings.map((p) => p.value) || [],
          },
        ]}
        unit="cm"
        label="Histórico de 48 horas até a última leitura da régua"
        maxGapMs={3600000}
      />
      <details>
        <summary>Ver últimas 20 leituras</summary>
        <Table
          headers={["Data / horário de Teresina", "Cota · cm"]}
          rows={
            d?.readings
              .slice(-20)
              .reverse()
              .map((p) => [dateTime(p.time), nf(p.value, 1)]) || []
          }
        />
      </details>
      <ExternalLink
        href={
          "https://sace.sgb.gov.br/relatorio.php?apenas_grafico=sim&bacia=parnaiba&" +
          (station === "chesf" ? "pm=11&s=14&sr=106" : "pm=7&s=6&sr=88")
        }
      >
        Abrir no SGB
      </ExternalLink>
    </Panel>
  );
}
export default function EnvironmentalView() {
  return (
    <>
      <RainGauges />
      <AirPanel />
      <FiresPanel />
      <WaterPanel />
      <RiverPanel />
      <NightPanel />
      <Panel title="Monitoramento climático municipal">
        <p>
          A Prefeitura publica relatórios de qualidade do ar. Esses documentos
          complementam os dados do modelo regional, mas não são medições ao vivo
          neste site.
        </p>
        <ExternalLink href="https://www.teresina.pi.gov.br/semai/monitoramento-climatico/">
          Conferir relatórios da SEMAI
        </ExternalLink>
      </Panel>
    </>
  );
}
