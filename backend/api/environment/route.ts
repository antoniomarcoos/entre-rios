import { serveRead } from "../../lib/api-security";
import { environmentData } from "../../lib/environment-data.mjs";

async function handle(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") || "";
  if (
    ![
      "water",
      "river-chesf",
      "river-cantinho",
      "flood-3",
      "flood-4",
      "flood-5",
    ].includes(kind)
  )
    return Response.json({ error: "Recurso inválido" }, { status: 400 });
  try {
    return Response.json(await environmentData(kind), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Environmental source failed", kind, error);
    return Response.json(
      {
        error: "Fonte temporariamente indisponível",
        checked_at: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  return serveRead(request, () => handle(request));
}
