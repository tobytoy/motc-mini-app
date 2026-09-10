import { Hono } from "hono";
import { cors } from "hono/cors";
import { ApiSearchEngine } from "../services/searchEngine";
import { MultiLayerNeedleClassifier } from "../classifier/multiLayerNeedle";
import type { Env } from "../types/env";

export const apiRouter = new Hono<{ Bindings: Env }>();

// Enable CORS for LINE Mini App and external web callers
apiRouter.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"]
}));

const searchEngine = new ApiSearchEngine();

/**
 * GET /api/search
 * Search TDX APIs by query, city, category, domain, restricted
 */
apiRouter.get("/search", async (c) => {
  const query = c.req.query("q") || "";
  const city = c.req.query("city") || "";
  const category = c.req.query("category") || "";
  const domain = c.req.query("domain") || "";
  const restrictedParam = c.req.query("restricted");
  const hotParam = c.req.query("hot");
  const newParam = c.req.query("new");
  const isHot = hotParam === "true" || hotParam === "1";
  const isNew = newParam === "true" || newParam === "1";
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  let restricted: boolean | null = null;
  if (restrictedParam === "true" || restrictedParam === "1") {
    restricted = true;
  } else if (restrictedParam === "false" || restrictedParam === "0") {
    restricted = false;
  }

  // If natural language query provided without explicit filters, use Multi-Layer Needle
  let needleResult = null;
  if (query && !city && !category) {
    const classifier = new MultiLayerNeedleClassifier(c.env);
    needleResult = await classifier.classify(query);
  }

  const results = searchEngine.search({
    query,
    city: city || needleResult?.layer3Entities.city,
    category,
    domain,
    restricted: restricted !== null ? restricted : needleResult?.layer3Entities.restricted,
    hot: isHot,
    new: isNew,
    limit,
    offset
  });
  return c.json({
    success: true,
    needle: needleResult,
    ...results
  });
});

/**
 * GET /api/categories
 * Returns statistics and counts by category
 */
apiRouter.get("/categories", (c) => {
  const stats = searchEngine.getStatistics();
  return c.json({
    success: true,
    ...stats
  });
});

/**
 * GET /api/api/:id
 * Retrieve detail of a single API
 */
apiRouter.get("/api/:id", (c) => {
  const id = c.req.param("id");
  const item = searchEngine.getById(id);
  if (!item) {
    return c.json({ success: false, error: "API not found" }, 404);
  }
  return c.json({ success: true, item });
});
