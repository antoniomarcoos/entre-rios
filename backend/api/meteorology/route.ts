import { serveRead } from "../../lib/api-security";
import { fetchPublic as fetch } from "../../lib/public-fetch.mjs";
import { meteorology, productPath } from "../../lib/inmet-data.mjs";
async function handle(request: Request) {
  const p = new URL(request.url).searchParams,
    kind = p.get("kind");
  if (!["image", "warnings", "forecast"].includes(kind || ""))
    return Response.json({ error: "Recurso inválido" }, { status: 400 });
  try {
    if (kind === "image") {
      let url;
      try {
        url = productPath(p.get("field"), Number(p.get("day") || 1));
      } catch {
        return Response.json({ error: "Produto inválido" }, { status: 400 });
      }
      const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
      const type = r.headers.get("content-type") || "";
      if (!r.ok || !/^image\/(jpeg|png|gif|webp)(;|$)/i.test(type))
        throw Error("Imagem indisponível");
      const headers: Record<string, string> = {
        "Content-Type": type,
        "Cache-Control": "private,max-age=300",
        "X-Source-Checked-At": new Date().toISOString(),
      };
      if (r.headers.get("last-modified"))
        headers["Last-Modified"] = r.headers.get("last-modified")!;
      return new Response(r.body, { headers });
    }
    return Response.json(
      await meteorology(kind, {
        ...(kind === "forecast"
          ? { date: p.get("date"), period: p.get("period") }
          : {}),
      }),
      { headers: { "Cache-Control": "private,no-store" } },
    );
  } catch {
    return Response.json(
      {
        error: "O INMET não respondeu à consulta",
        checked_at: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  return serveRead(request, () => handle(request));
}
