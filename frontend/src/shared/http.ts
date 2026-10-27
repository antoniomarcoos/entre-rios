import type { z } from "zod";
export async function json<T>(
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  timeout = 35000,
): Promise<T> {
  const r = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)]),
    credentials: "same-origin",
    redirect: "error",
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw Error("Fonte indisponível");
  if (Number(r.headers.get("content-length")) > 16000000)
    throw Error("Resposta muito grande");
  const text = await r.text();
  if (text.length > 16000000) throw Error("Resposta muito grande");
  return schema.parse(JSON.parse(text));
}
