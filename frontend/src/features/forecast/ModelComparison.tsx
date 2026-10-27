import { comparison, nf, spread, type ForecastResponse } from "./data";
export function ModelComparison({
  data,
  date,
  modelError,
}: {
  data: ForecastResponse | null;
  date: string;
  modelError: boolean;
}) {
  const rows = comparison(data, date),
    count = rows.filter((r) =>
      [r.max, r.min, r.rain, r.gust].some((v) => v !== null),
    ).length;
  const status =
    count >= 2
      ? `Modelos com dados: ${count}/3. Diferença entre máximas: ${nf(spread(rows, "max"), 1)} °C; entre acumulados de chuva: ${nf(spread(rows, "rain"), 1)} mm.`
      : modelError
        ? "A comparação não carregou. A previsão de sete dias continua disponível."
        : "Não há dois modelos com dados para comparar neste dia.";
  return (
    <article className="panel extended-panel">
      <div className="eyebrow">ECMWF · GFS · ICON</div>
      <h2>Os modelos estão de acordo?</h2>
      <p>
        São três previsões para o mesmo ponto e dia. Quanto maior a diferença,
        maior a divergência entre eles. Concordância não garante que a previsão
        se confirme.
      </p>
      <p id="model-status" role="status">
        {date ? status : "Aguardando comparação."}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Máxima</th>
              <th>Mínima</th>
              <th>Chuva no dia</th>
              <th>Rajada máxima</th>
            </tr>
          </thead>
          <tbody id="model-rows">
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{nf(row.max, 1)} °C</td>
                <td>{nf(row.min, 1)} °C</td>
                <td>{nf(row.rain, 1)} mm</td>
                <td>{nf(row.gust, 1)} km/h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small>
        — indica dado ausente. A comparação usa ECMWF IFS 0,25°, GFS Seamless e
        ICON Global via Open-Meteo, com resoluções e ciclos próprios.
      </small>
    </article>
  );
}
