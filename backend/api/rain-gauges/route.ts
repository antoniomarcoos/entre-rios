import { serveRead } from "../../lib/api-security";
import { rainGauges } from "../../lib/rain-gauges.mjs";
async function handle() {
  return Response.json(await rainGauges(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  return serveRead(request, () => handle());
}
