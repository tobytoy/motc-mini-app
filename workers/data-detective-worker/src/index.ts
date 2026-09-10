import { Hono } from "hono";
import { apiRouter } from "./routes/api";
import { MultiLayerNeedleClassifier } from "./classifier/multiLayerNeedle";
import { ApiSearchEngine } from "./services/searchEngine";
import type { Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();

// Mount API routes
app.route("/api", apiRouter);

// Health Check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "motc-data-detective-worker",
    totalApis: 738,
    liff: {
      dev: c.env.LIFF_URL_DEV,
      review: c.env.LIFF_URL_REVIEW,
      published: c.env.LIFF_URL_PUB
    },
    timestamp: new Date().toISOString()
  });
});

// Diagnostic Multi-Layer Needle Test Endpoint
app.post("/test/classify", async (c) => {
  const body = await c.req.json<{ text: string }>();
  const text = body.text || "";

  const classifier = new MultiLayerNeedleClassifier(c.env);
  const needle = await classifier.classify(text);
  const searchEngine = new ApiSearchEngine();
  const searchResult = searchEngine.search({
    query: needle.layer3Entities.keyword || text,
    city: needle.layer3Entities.city,
    restricted: needle.layer3Entities.restricted,
    limit: 5
  });
  return c.json({
    input: text,
    needle,
    matchesCount: searchResult.total,
    topMatches: searchResult.items
  });
});

// Root handler
app.get("/", (c) => {
  return c.json({
    service: "MOTC Data Query Detective API",
    docs: "/api/categories",
    search: "/api/search?q=公車",
    liff: c.env.LIFF_URL_DEV
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found", message: "Data Detective Worker Endpoint" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("[Data Detective Error]:", err);
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

export default {
  fetch: app.fetch
};

export { app };
