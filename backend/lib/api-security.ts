const buckets = new Map<string, { at: number; count: number }>();
export function validateAPI(
  request: Request,
  now = Date.now(),
): Response | null {
  const url = new URL(request.url);
  if (!["GET", "HEAD"].includes(request.method))
    return Response.json(
      { error: "Método não permitido" },
      { status: 405, headers: { Allow: "GET, HEAD" } },
    );
  if (url.search.length > 2048)
    return Response.json({ error: "Consulta muito longa" }, { status: 414 });
  const allowed: Record<string, string[]> = {
    "/api/environment": ["kind"],
    "/api/meteorology": ["kind", "field", "day", "date", "period", "v"],
    "/api/climate": ["format"],
    "/api/rain-gauges": [],
    "/api/fires": [],
  };
  const keys = allowed[url.pathname];
  if (!keys)
    return Response.json({ error: "Recurso inexistente" }, { status: 404 });
  for (const key of url.searchParams.keys())
    if (!keys.includes(key) || url.searchParams.getAll(key).length !== 1)
      return Response.json({ error: "Parâmetros inválidos" }, { status: 400 });
  const p = url.searchParams,
    kind = p.get("kind");
  const bad = () =>
    Response.json({ error: "Seleção inválida" }, { status: 400 });
  if (
    url.pathname === "/api/environment" &&
    ![
      "water",
      "river-chesf",
      "river-cantinho",
      "flood-3",
      "flood-4",
      "flood-5",
    ].includes(kind || "")
  )
    return bad();
  if (
    url.pathname === "/api/climate" &&
    p.has("format") &&
    p.get("format") !== "csv"
  )
    return bad();
  if (url.pathname === "/api/meteorology") {
    if (!["image", "warnings", "forecast"].includes(kind || "")) return bad();
    if (
      kind === "image" &&
      (![
        "temperature",
        "minimum",
        "humidity",
        "humidity_max",
        "rain",
        "satellite",
        "animation",
      ].includes(p.get("field") || "") ||
        (p.has("day") && !/^[1-7]$/.test(p.get("day") || "")) ||
        (p.has("v") && !/^\d{1,16}$/.test(p.get("v") || "")))
    )
      return bad();
    if (kind === "forecast") {
      const date = p.get("date") || "",
        period = p.get("period") || "";
      const today = new Date(now - 10800000).toISOString().slice(0, 10),
        offset =
          (Date.parse(date + "T00:00:00-03:00") -
            Date.parse(today + "T00:00:00-03:00")) /
          86400000;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isInteger(offset) ||
        offset < 0 ||
        offset > 4 ||
        !["manha", "tarde", "noite"].includes(period)
      )
        return bad();
    }
  }
  const ip = request.headers.get("cf-connecting-ip") || "anonymous";
  for (const [k, b] of buckets) if (now - b.at > 60000) buckets.delete(k);
  if (buckets.size >= 512 && !buckets.has(ip))
    return Response.json(
      { error: "Tente novamente em instantes" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  const b = buckets.get(ip) || { at: now, count: 0 };
  b.count++;
  buckets.set(ip, b);
  if (b.count > 120)
    return Response.json(
      { error: "Muitas consultas. Aguarde um minuto." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  return null;
}
export function securityHeaders(response: Response, html = false) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  headers.delete("X-Powered-By");
  if (html)
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.tile.openstreetmap.org https://portal.inmet.gov.br; connect-src 'self' https://api.open-meteo.com https://air-quality-api.open-meteo.com; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
    );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Applied at each route so guards also hold when the hosting adapter dispatches directly. */
export async function serveRead(
  request: Request,
  handler: () => Response | Promise<Response>,
) {
  const denied = validateAPI(request);
  if (denied) return securityHeaders(denied);
  try {
    return securityHeaders(await handler());
  } catch {
    return securityHeaders(
      Response.json(
        {
          error: "Fonte temporariamente indisponível",
          checked_at: new Date().toISOString(),
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      ),
    );
  }
}
