import type { ReactNode } from "react";
import { dateTime, freshness } from "./format";
export function Panel({
  children,
  className = "",
  title,
  eyebrow,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <article className={"panel feature-panel " + className}>
      {title && (
        <div className="panel-heading">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </article>
  );
}
export function Table({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: ReactNode[][];
  caption?: string;
}) {
  return (
    <div className="table-wrap">
      <table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {headers.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Status({
  status,
  error,
  children,
}: {
  status: string;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <p className="environment-copy" role="status">
      {status === "loading"
        ? "Consultando a fonte…"
        : status === "error"
          ? error || "A consulta falhou. Tente novamente."
          : status === "idle"
            ? "Aguardando consulta."
            : children}
    </p>
  );
}
export function SourceAge({
  reference,
  checkedAt,
  maxAge,
}: {
  reference?: string;
  checkedAt?: string;
  maxAge?: number;
}) {
  return (
    <p className="data-health">
      {freshness(reference, checkedAt, maxAge)} · referência{" "}
      {dateTime(reference)} · consulta {dateTime(checkedAt)}
    </p>
  );
}
export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} ↗
    </a>
  );
}
