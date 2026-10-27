export const TZ = "America/Fortaleza";
export const nf = (value: unknown, digits = 0) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("pt-BR", { maximumFractionDigits: digits })
    : "—";
export function parseTime(value: string | undefined | null): number {
  if (!value) return NaN;
  return Date.parse(
    /(Z|[+-]\d\d:\d\d)$/.test(value)
      ? value
      : value.replace(" ", "T") + "-03:00",
  );
}
export const dateTime = (value: string | number | undefined | null) => {
  const time = typeof value === "number" ? value : parseTime(value);
  return Number.isFinite(time)
    ? new Date(time).toLocaleString("pt-BR", { timeZone: TZ })
    : "horário não informado";
};
export const shortTime = (value: string) =>
  value.slice(11, 16) + " · " + value.slice(8, 10) + "/" + value.slice(5, 7);
export const localDate = (offset = 0, now = Date.now()) =>
  new Date(now - 10800000 + offset * 86400000).toISOString().slice(0, 10);
export function freshness(
  reference: string | undefined,
  checkedAt: string | undefined,
  maxAge = 7200000,
  now = Date.now(),
) {
  const time = parseTime(reference),
    checked = parseTime(checkedAt);
  if (!Number.isFinite(time)) return "Referência não informada";
  if (time > now + 900000) return "Horário da fonte precisa de conferência";
  if (now - time > maxAge) return "Referência antiga";
  if (!Number.isFinite(checked) || now - checked > 1200000)
    return "Consulta precisa ser renovada";
  return "Consulta recente";
}
export const weatherDescription = (code: number | null) =>
  code === null
    ? "Condição não informada"
    : code === 0
      ? "Céu limpo"
      : code <= 3
        ? "Variação de nebulosidade"
        : code <= 48
          ? "Névoa ou nevoeiro"
          : code <= 86
            ? "Precipitação prevista"
            : "Possibilidade de tempestade";
