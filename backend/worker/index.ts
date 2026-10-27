import handler from "vinext/server/fetch-handler";
import { securityHeaders } from "../lib/api-security";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const response = await handler.fetch(request, env, ctx);
    return securityHeaders(
      response,
      (response.headers.get("content-type") || "").includes("text/html"),
    );
  },
};

export default worker;
