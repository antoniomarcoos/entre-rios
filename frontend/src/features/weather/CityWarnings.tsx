import { selectCityWarnings } from "./warnings";
import { useEffect, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { useQuery } from "../../shared/useQuery";
import { json } from "../../shared/http";
import { warningsSchema } from "../../shared/schemas";
import { dateTime, parseTime } from "../../shared/format";
import { ExternalLink } from "../../shared/ui";

export function CityWarnings() {
  const { revision } = useApp(),
    q = useQuery(
      "warnings",
      (s) => json("/api/meteorology?kind=warnings", warningsSchema, s),
      { revision },
    ),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const age = now - parseTime(q.data?.checked_at),
    valid = q.status === "ready" && age >= -900000 && age < 1200000,
    items = valid ? selectCityWarnings(q.data!.data, now) : [],
    active = items.filter((a) => a.active),
    title =
      q.status === "loading"
        ? "Consultando avisos meteorológicos…"
        : !valid
          ? "Não foi possível verificar os avisos"
          : active.length
            ? active.length + " aviso(s) em vigor para Teresina"
            : items.length
              ? "Aviso previsto para Teresina"
              : "Nenhum aviso em vigor para Teresina nesta consulta";
  return (
    <article
      className="city-warning"
      data-state={
        !valid
          ? "unknown"
          : active.length
            ? "active"
            : items.length
              ? "future"
              : "clear"
      }
    >
      <div className="warning-summary">
        <span className="warning-symbol" aria-hidden="true">
          !
        </span>
        <div>
          <div className="eyebrow">AVISOS OFICIAIS · TERESINA</div>
          <h2>{title}</h2>
          <p role="status">
            {valid
              ? "INMET · consultado em " + dateTime(q.data?.checked_at)
              : "Consulte o INMET para verificar a situação."}
          </p>
        </div>
        <button
          className="refresh"
          onClick={() => void q.refresh()}
          disabled={q.status === "loading"}
        >
          Consultar
        </button>
      </div>
      {items.map((a) => (
        <details
          className="city-warning-item"
          style={{ borderLeftColor: a.color }}
          key={a.id}
        >
          <summary>
            {a.active ? "Em vigor: " : "Previsto: "}
            {a.title} · {a.severity}
          </summary>
          <p>
            De {dateTime(a.start)} até {dateTime(a.end)}
          </p>
          {a.risks?.map((r, i) => (
            <p key={i}>{r}</p>
          ))}
          {a.instructions?.length ? (
            <>
              <strong>Orientações do INMET</strong>
              <ul>
                {a.instructions.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          ) : null}
          <ExternalLink
            href={"https://avisos.inmet.gov.br/" + encodeURIComponent(a.id)}
          >
            Ler aviso completo
          </ExternalLink>
        </details>
      ))}
      {!valid && (
        <ExternalLink href="https://avisos.inmet.gov.br/">
          Consultar avisos no INMET
        </ExternalLink>
      )}
    </article>
  );
}
