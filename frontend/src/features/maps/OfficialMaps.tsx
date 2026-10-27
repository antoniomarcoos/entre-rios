import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import { officialForecastSchema, warningsSchema } from "../../shared/schemas";
import { dateTime, localDate, parseTime } from "../../shared/format";
import { Panel, Status, ExternalLink } from "../../shared/ui";
import { MapCanvas, type MapArea } from "./MapCanvas";
type Product = "numeric" | "satellite" | "forecast" | "warnings";
const sources = {
  numeric: "https://vime.inmet.gov.br/",
  satellite: "https://satelite.inmet.gov.br/",
  forecast: "https://previsao.inmet.gov.br/",
  warnings: "https://avisos.inmet.gov.br/",
};
const codes = {
  temperature: "tmax_",
  minimum: "tmin_",
  humidity: "umin_",
  humidity_max: "umax_",
  rain: "",
};
function ImageProduct({
  field,
  day,
  revision,
}: {
  field: string;
  day: number;
  revision: number;
}) {
  const [fallback, setFallback] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "error">("loading"),
    [checkedAt, setCheckedAt] = useState(0),
    [open, setOpen] = useState(false),
    [zoom, setZoom] = useState(100),
    dialog = useRef<HTMLDialogElement>(null);
  const official =
    field === "satellite" || field === "animation"
      ? "https://portal.inmet.gov.br/uploads/satelite/BR." +
        (field === "animation" ? "gif" : "jpg")
      : "https://portal.inmet.gov.br/uploads/previsao/web_BR_" +
        codes[field as keyof typeof codes] +
        day +
        ".jpg";
  const url = fallback
    ? official + "?consulta=" + revision
    : "/api/meteorology?kind=image&field=" +
      field +
      "&day=" +
      day +
      "&v=" +
      revision;
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [open]);
  const alt =
    field === "satellite" || field === "animation"
      ? "Imagem oficial de satélite do INMET com horário impresso"
      : "Mapa oficial do INMET com legenda, unidade e validade";
  return (
    <>
      <p role="status">
        {status === "loading"
          ? "Consultando imagem do INMET…"
          : status === "error"
            ? "Imagem indisponível nesta consulta. Tente novamente ou abra o INMET."
            : "INMET · imagem recebida em " +
              dateTime(checkedAt) +
              ". A data do produto está impressa no mapa."}
      </p>
      <div
        className={
          "met-image-stage " + (status === "ready" ? "" : "image-loading")
        }
      >
        <img
          src={url}
          alt={alt}
          hidden={status !== "ready"}
          onLoad={() => {
            setStatus("ready");
            setCheckedAt(Date.now());
          }}
          onError={() => {
            if (!fallback) setFallback(true);
            else setStatus("error");
          }}
        />
      </div>
      <p>
        Legenda, unidade e validade preservadas na imagem oficial. A numeração
        do dia segue o produto publicado pelo INMET.
      </p>
      <button
        className="refresh"
        disabled={status !== "ready"}
        onClick={() => {
          setZoom(100);
          setOpen(true);
        }}
      >
        ⛶ Ampliar mapa
      </button>
      <dialog
        ref={dialog}
        className="image-dialog"
        onCancel={() => setOpen(false)}
        aria-labelledby="official-dialog-title"
      >
        <div className="met-dialog-toolbar">
          <h2 id="official-dialog-title">Mapa meteorológico · INMET</h2>
          <button
            className="refresh"
            disabled={zoom === 100}
            onClick={() => setZoom((z) => Math.max(100, z - 50))}
            aria-label="Reduzir imagem"
          >
            −
          </button>
          <button
            className="refresh"
            disabled={zoom === 400}
            onClick={() => setZoom((z) => Math.min(400, z + 50))}
            aria-label="Ampliar imagem"
          >
            +
          </button>
          <button className="refresh" onClick={() => setOpen(false)}>
            Fechar
          </button>
        </div>
        <p>Use + para ler os detalhes e deslize pela imagem.</p>
        <div className="dialog-scroll">
          <img
            src={url}
            alt={alt}
            style={{ width: zoom + "%", maxWidth: "none" }}
          />
        </div>
      </dialog>
    </>
  );
}
export function OfficialMaps() {
  const { revision } = useApp(),
    [active, setActive] = useState(false),
    [tab, setTab] = useState<Product>("numeric"),
    [field, setField] = useState("temperature"),
    [day, setDay] = useState(1),
    [animation, setAnimation] = useState(false),
    [chosenDate, setDate] = useState(""),
    [period, setPeriod] = useState("manha"),
    [warningPeriod, setWarningPeriod] = useState("hoje"),
    [tick, setTick] = useState(0),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      if (!document.hidden) setTick((n) => n + 1);
    }, 300000);
    return () => clearInterval(t);
  }, [active]);
  const dates = Array.from({ length: 5 }, (_, i) => localDate(i)),
    date = dates.includes(chosenDate) ? chosenDate : dates[0],
    offset = dates.indexOf(date);
  const forecast = useQuery(
    "official-forecast:" + date + ":" + period,
    (s) =>
      json(
        "/api/meteorology?kind=forecast&date=" + date + "&period=" + period,
        officialForecastSchema,
        s,
      ),
    { enabled: active && tab === "forecast", revision: revision + tick },
  );
  const warnings = useQuery(
    "warnings",
    (s) => json("/api/meteorology?kind=warnings", warningsSchema, s),
    { enabled: active && tab === "warnings", revision },
  );
  const items = useMemo(
      () =>
        warnings.data?.data.filter(
          (a) => a.period === warningPeriod && parseTime(a.end) >= now,
        ) || [],
      [warnings.data, warningPeriod, now],
    ),
    local = items.filter((a) => a.teresina);
  const areas = useMemo<MapArea[]>(
    () =>
      tab === "warnings"
        ? items.map((a) => ({
            geometry: a.geometry,
            color: a.color,
            label:
              a.title +
              " · " +
              a.severity +
              " · de " +
              dateTime(a.start) +
              " até " +
              dateTime(a.end),
          }))
        : (forecast.data?.data || []).map((a) => ({
            geometry: a.geometry,
            color: a.color,
            label:
              a.name +
              " · " +
              a.summary +
              " · mínima " +
              a.min +
              " °C · máxima " +
              a.max +
              " °C",
          })),
    [tab, items, forecast.data],
  );
  const selectedField =
      tab === "satellite" ? (animation ? "animation" : "satellite") : field,
    imageKey = [tab, selectedField, day, revision, tick].join(":");
  return (
    <Panel
      title="Mapas meteorológicos"
      eyebrow="BRASIL E AMÉRICA DO SUL · INMET"
      action={<ExternalLink href={sources[tab]}>Abrir no INMET</ExternalLink>}
    >
      <p>Nuvens, previsão e avisos em uma visão mais ampla.</p>
      <div className="met-tabs">
        {(["numeric", "satellite", "forecast", "warnings"] as const).map(
          (t, i) => (
            <button
              className="refresh"
              aria-pressed={tab === t}
              key={t}
              onClick={() => {
                setTab(t);
                setActive(true);
              }}
            >
              {
                [
                  "Previsão numérica",
                  "Satélite",
                  "Previsão do tempo",
                  "Avisos meteorológicos",
                ][i]
              }
            </button>
          ),
        )}
      </div>
      {!active && (
        <button className="refresh" onClick={() => setActive(true)}>
          Carregar mapas do INMET
        </button>
      )}
      {active && (
        <>
          <div className="met-controls">
            {tab === "numeric" && (
              <>
                <label>
                  Variável
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                  >
                    {[
                      ["temperature", "Temperatura máxima · °C"],
                      ["minimum", "Temperatura mínima · °C"],
                      ["humidity", "Umidade mínima · %"],
                      ["humidity_max", "Umidade máxima · %"],
                      ["rain", "Chuva acumulada · mm"],
                    ].map(([v, t]) => (
                      <option value={v} key={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Período publicado
                  <select
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option value={n} key={n}>
                        Dia {n}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {tab === "satellite" && (
              <label>
                <input
                  type="checkbox"
                  checked={animation}
                  onChange={(e) => setAnimation(e.target.checked)}
                />
                Imagem animada
              </label>
            )}
            {tab === "forecast" && (
              <>
                <label>
                  Data
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  >
                    {dates.map((d) => (
                      <option key={d} value={d}>
                        {d.split("-").reverse().join("/")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Turno
                  <select
                    disabled={offset >= 2}
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
                  </select>
                </label>
              </>
            )}
            {tab === "warnings" && (
              <label>
                Período
                <select
                  value={warningPeriod}
                  onChange={(e) => setWarningPeriod(e.target.value)}
                >
                  <option value="hoje">Hoje</option>
                  <option value="futuro">Próximos dias</option>
                </select>
              </label>
            )}
          </div>
          {["numeric", "satellite"].includes(tab) ? (
            <ImageProduct
              key={imageKey}
              field={selectedField}
              day={day}
              revision={revision + tick}
            />
          ) : (
            <>
              <Status
                status={tab === "warnings" ? warnings.status : forecast.status}
              >
                INMET · consulta{" "}
                {dateTime(
                  tab === "warnings"
                    ? warnings.data?.checked_at
                    : forecast.data?.checked_at,
                )}{" "}
                ·{" "}
                {tab === "warnings"
                  ? local.length + " aviso(s) para Teresina nesta seleção"
                  : "previsão para " +
                    date +
                    (offset >= 2 ? " · diária" : " · " + period)}
                .
              </Status>
              <MapCanvas
                latitude={-9}
                longitude={-48}
                zoom={4}
                areas={areas}
                label="Áreas de previsão e avisos oficiais do INMET"
              />
              {tab === "warnings" ? (
                local.map((a) => (
                  <details
                    className="city-warning-item"
                    key={a.id}
                    style={{ borderLeftColor: a.color }}
                  >
                    <summary>
                      {a.title} · {a.severity}
                    </summary>
                    <p>
                      De {dateTime(a.start)} até {dateTime(a.end)}
                    </p>
                    {a.risks?.map((r, i) => (
                      <p key={i}>{r}</p>
                    ))}
                    {a.instructions?.map((r, i) => (
                      <p key={i}>{r}</p>
                    ))}
                    <ExternalLink
                      href={
                        "https://avisos.inmet.gov.br/" +
                        encodeURIComponent(a.id)
                      }
                    >
                      Ver aviso completo
                    </ExternalLink>
                  </details>
                ))
              ) : (
                <div className="met-forecast-legend">
                  {[
                    ...new Map(
                      forecast.data?.data.map((a) => [a.summary, a.color]),
                    ).entries(),
                  ].map(([text, color]) => (
                    <span key={text}>
                      <i style={{ background: color }} />
                      {text}
                    </span>
                  ))}
                </div>
              )}
              <p>
                Toque nas áreas para conferir o produto. A indicação de Teresina
                usa o código municipal informado pelo INMET.
              </p>
            </>
          )}
        </>
      )}
    </Panel>
  );
}
