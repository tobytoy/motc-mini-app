import assert from "node:assert/strict";
import { app } from "../src/index";
import { ApiSearchEngine } from "../src/services/searchEngine";
import { MultiLayerNeedleClassifier } from "../src/classifier/multiLayerNeedle";
import type { Env } from "../src/types/env";

const MOCK_ENV: Env = {
  ENVIRONMENT: "test",
  LINE_CHANNEL_ID_DEV: "2011521041",
  LINE_CHANNEL_ID_REVIEW: "2011521042",
  LINE_CHANNEL_ID_PUB: "2011521043",
  LIFF_URL_DEV: "https://miniapp.line.me/2011521041-JnfPdXhF",
  LIFF_URL_REVIEW: "https://miniapp.line.me/2011521042-DPBvOagG",
  LIFF_URL_PUB: "https://miniapp.line.me/2011521043-1nCM8mEa",
  TDX_BASIC_PORTAL_URL: "https://tdx.transportdata.tw/data-service/basic",
  MINI_APP_SEARCH_URL: "https://motc-mini-dog.pages.dev/search.html"
};

async function runTests() {
  console.log("=== [1] Testing ApiSearchEngine ===");
  const engine = new ApiSearchEngine();
  const stats = engine.getStatistics();
  console.log(`  Total APIs loaded: ${stats.total}`);
  assert.equal(stats.total, 738, "Total APIs must be exactly 738");
  assert.ok(stats.publicCount > 500, "Public APIs must be > 500");
  assert.ok(stats.restrictedCount > 150, "Restricted APIs must be > 150");

  // Search "公車"
  const busSearch = engine.search({ query: "公車", limit: 10 });
  assert.ok(busSearch.total > 100, "Bus search should match > 100 APIs");
  assert.equal(busSearch.items.length, 10);
  console.log(`  ✓ Search "公車": matched ${busSearch.total} APIs`);

  // Search "停車場"
  const parkingSearch = engine.search({ query: "停車場", limit: 5 });
  assert.ok(parkingSearch.total > 20, "Parking search should match > 20 APIs");
  console.log(`  ✓ Search "停車場": matched ${parkingSearch.total} APIs`);

  // Restricted filter
  const publicOnly = engine.search({ restricted: false, limit: 10 });
  for (const item of publicOnly.items) {
    assert.equal(item.restricted, false, "All items must be non-restricted");
  }
  console.log("  ✓ Restricted filter working correctly\n");

  console.log("=== [2] Testing MultiLayerNeedleClassifier ===");
  const classifier = new MultiLayerNeedleClassifier(MOCK_ENV);

  const testCases = [
    {
      input: "台北市公車即時預估到站",
      expectedDomain: "transport",
      expectedOp: "realtime_eta",
      expectedCity: "Taipei"
    },
    {
      input: "路外停車場剩餘車位",
      expectedDomain: "parking",
      expectedOp: "parking_availability"
    },
    {
      input: "台中易肇事路口排行",
      expectedDomain: "safety",
      expectedOp: "accident_rank",
      expectedCity: "Taichung"
    },
    {
      input: "轉乘空間縫隙統計",
      expectedDomain: "governance",
      expectedOp: "transfer_space_gap"
    },
    {
      input: "公車電子原始票證",
      expectedDomain: "ticket"
    }
  ];

  for (const tc of testCases) {
    const res = await classifier.classify(tc.input);
    assert.equal(res.layer1Domain, tc.expectedDomain, `Domain for '${tc.input}' should be ${tc.expectedDomain}`);
    if (tc.expectedOp) {
      assert.equal(res.layer2Operation, tc.expectedOp, `Op for '${tc.input}' should be ${tc.expectedOp}`);
    }
    if (tc.expectedCity) {
      assert.equal(res.layer3Entities.city, tc.expectedCity, `City for '${tc.input}' should be ${tc.expectedCity}`);
    }
    console.log(`  ✓ '${tc.input}' -> Domain: ${res.layer1Domain}, Op: ${res.layer2Operation}, City: ${res.layer3Entities.city || "none"}`);
  }
  console.log("✓ Multi-Layer Needle tests passed\n");

  console.log("=== [3] Testing HTTP API Endpoints ===");
  // 1. Health
  const healthRes = await app.request("/health", {}, MOCK_ENV);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json() as { status: string; totalApis: number };
  assert.equal(healthJson.status, "ok");
  assert.equal(healthJson.totalApis, 738);
  console.log("  ✓ GET /health returned 200 OK");

  // 2. Categories
  const catRes = await app.request("/api/categories", {}, MOCK_ENV);
  assert.equal(catRes.status, 200);
  const catJson = await catRes.json() as { success: boolean; total: number };
  assert.equal(catJson.success, true);
  assert.equal(catJson.total, 738);
  console.log("  ✓ GET /api/categories returned 200 OK");

  // 3. Search API
  const searchRes = await app.request("/api/search?q=公車&limit=5", {}, MOCK_ENV);
  assert.equal(searchRes.status, 200);
  const searchJson = await searchRes.json() as { success: boolean; total: number; items: unknown[] };
  assert.equal(searchJson.success, true);
  assert.ok(searchJson.total > 0);
  assert.equal(searchJson.items.length, 5);
  console.log(`  ✓ GET /api/search returned 200 OK with ${searchJson.total} total results`);

  // 4. Test Classify Endpoint
  const classifyRes = await app.request("/test/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "台北市公車站牌" })
  }, MOCK_ENV);
  assert.equal(classifyRes.status, 200);
  const classifyJson = await classifyRes.json() as { input: string; matchesCount: number };
  assert.equal(classifyJson.input, "台北市公車站牌");
  assert.ok(classifyJson.matchesCount > 0);
  console.log(`  ✓ POST /test/classify returned 200 OK with ${classifyJson.matchesCount} matches`);

  console.log("\n🎉 ALL DATA DETECTIVE TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
