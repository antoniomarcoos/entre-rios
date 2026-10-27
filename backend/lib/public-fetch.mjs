// Server-side network boundary: no caller-controlled hosts, redirects, or unbounded bodies.
const HOSTS = new Set([
  "portal.inmet.gov.br",
  "apiprevmet3.inmet.gov.br",
  "www.semarh.pi.gov.br",
  "sace.sgb.gov.br",
  "geoportal.sgb.gov.br",
  "api.open-meteo.com",
  "power.larc.nasa.gov",
  "resources.cemaden.gov.br",
  "dataserver-coids.inpe.br",
]);
export function allowedSource(input) {
  const u = new URL(input);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443") ||
    !HOSTS.has(u.hostname)
  )
    throw Error("Destino externo não permitido");
  return u;
}
async function fetchBounded(input, init = {}) {
  let url = allowedSource(input);
  const signal = init.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(55000)])
    : AbortSignal.timeout(30000);
  for (let i = 0; i < 4; i++) {
    const r = await globalThis.fetch(url, {
      ...init,
      signal,
      redirect: "manual",
      credentials: "omit",
    });
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const target = r.headers.get("location");
      await r.body?.cancel();
      if (!target) throw Error("Redirecionamento inválido");
      url = allowedSource(new URL(target, url));
      continue;
    }
    if (Number(r.headers.get("content-length")) > 16000000) {
      await r.body?.cancel();
      throw Error("Resposta externa excede o limite");
    }
    if (!r.body) return r;
    const reader = r.body.getReader();
    let total = 0;
    const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > 16000000) throw Error("Resposta externa excede o limite");
        chunks.push(value);
      }
    } catch (e) {
      await reader.cancel();
      throw e;
    } finally {
      reader.releaseLock();
    }
    return new Response(new Blob(chunks), {
      status: r.status,
      statusText: r.statusText,
      headers: r.headers,
    });
  }
  throw Error("Muitos redirecionamentos");
}

let active = 0;
export async function fetchPublic(input, init = {}) {
  if (active >= 8) throw Error("Limite temporário de consultas externas");
  active++;
  try {
    return await fetchBounded(input, init);
  } finally {
    active--;
  }
}
