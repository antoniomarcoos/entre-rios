import { serveRead } from "../../lib/api-security";
import { fireData } from "../../lib/fire-data.mjs";
async function handle() {
  try {
    return Response.json(await fireData(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error: "Consulta ao INPE indisponível",
        checked_at: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  return serveRead(request, () => handle());
}
