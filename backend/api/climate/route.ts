import { serveRead } from "../../lib/api-security";
import { liveClimate, analyzeClimate } from "../../lib/climate-data.mjs";
import { climateCSV } from "../../lib/climate-csv.mjs";
import snapshot from "../../lib/climate-snapshot.json";
async function handle(request: Request) {
  const format = new URL(request.url).searchParams.get("format");
  if (format && format !== "csv")
    return Response.json({ error: "Formato inválido" }, { status: 400 });
  let data;
  try {
    data = await liveClimate();
  } catch {
    try {
      data = {
        ...analyzeClimate(snapshot.raw),
        source_url: snapshot.source_url,
        checked_at: snapshot.checked_at,
        saved_copy: true,
        last_attempt: new Date().toISOString(),
      };
    } catch {
      return Response.json(
        { error: "Histórico climático indisponível" },
        { status: 503 },
      );
    }
  }
  if (format === "csv")
    return new Response(climateCSV(data), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="teresina-nasa-power-temperatura-mensal.csv"',
        "Cache-Control": "private,no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  return Response.json(data, {
    headers: { "Cache-Control": "private,no-store" },
  });
}

export async function GET(request: Request) {
  return serveRead(request, () => handle(request));
}
