import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";

// Dev plugin to serve Cloudflare Pages Functions locally during `vite`
function pagesFunctionsDevPlugin(): Plugin {
  return {
    name: "pages-functions-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

        if (url.pathname === "/api/health") {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              status: "healthy",
              mode: "vite-dev",
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (url.pathname === "/api/nearby") {
          try {
            // Dynamically invoke the TypeScript Pages Function in dev
            const nearbyModule = await server.ssrLoadModule("/functions/api/nearby.ts");
            const env = loadEnv("development", process.cwd(), "");

            const fakeContext = {
              request: new Request(url.toString(), {
                method: req.method,
                headers: req.headers as unknown as HeadersInit,
              }),
              env: {
                TDX_CLIENT_ID: env.TDX_CLIENT_ID,
                TDX_CLIENT_SECRET: env.TDX_CLIENT_SECRET,
                CWA_API_KEY: env.CWA_API_KEY,
                GEMINI_API_KEY: env.GEMINI_API_KEY,
                ENABLE_GEMINI_ADVICE: env.ENABLE_GEMINI_ADVICE,
                TRANSPORT_DATA_SOURCE: env.TRANSPORT_DATA_SOURCE,
                TRANSPORT_MCP_BASE_URL: env.TRANSPORT_MCP_BASE_URL,
                TRANSPORT_MCP_API_KEY: env.TRANSPORT_MCP_API_KEY,
              },
              params: {},
              data: {},
              waitUntil: () => {},
              next: async () => new Response("Not Found", { status: 404 }),
            };

            const response: Response = await nearbyModule.onRequestGet(fakeContext);
            res.statusCode = response.status;
            response.headers.forEach((val, key) => {
              res.setHeader(key, val);
            });
            const text = await response.text();
            res.end(text);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Internal error";
            console.error("[Vite Dev API Error]", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: msg }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [pagesFunctionsDevPlugin()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
});
