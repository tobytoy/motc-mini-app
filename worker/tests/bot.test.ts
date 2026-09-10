import assert from "node:assert/strict";
import { app } from "../src/index";
import { generateLineSignature, verifyLineSignature } from "../src/line/verifier";
import { NeedleClassifier } from "../src/classifier/needle";
import {
  createTdxFlexMessage,
  createMiniAppFlexMessage,
  createWhoAreYouFlexMessage,
  createHelpFlexMessage,
  createFormFlexMessage,
  createDetectiveFlexMessage,
  generateFeedbackTicketId,
  buildPrefilledFeedbackFormUrl,
  createFeedbackFlexMessage,
  createAllInclusiveProjectsFlexMessage,
  createExternalProjectsFlexMessage
} from "../src/line/templates";
import type { Env } from "../src/types/env";
import type { LineFlexMessage } from "../src/types/line";

const MOCK_ENV: Env = {
  ENVIRONMENT: "test",
  LINE_CHANNEL_ID: "2011514766",
  LINE_CHANNEL_SECRET: "mock_test_channel_secret_32chars",
  TDX_PORTAL_URL: "https://tdx.transportdata.tw/",
  MINI_APP_URL: "https://motc-mini-dog.pages.dev/",
  PROJECT_MGMT_URL: "https://ai.studio/apps/0bd118d7-407b-4576-bf5b-e354f697c2cf"
};

async function runTests() {
  console.log("=== [1] Testing LINE Signature Verifier ===");
  const secret = MOCK_ENV.LINE_CHANNEL_SECRET;
  const sampleBody = JSON.stringify({ events: [{ type: "message", text: "/你是誰" }] });
  const validSignature = await generateLineSignature(sampleBody, secret);
  assert.ok(validSignature, "Signature must be generated");

  const verified = await verifyLineSignature(sampleBody, validSignature, secret);
  assert.equal(verified, true, "Valid signature must pass");

  const badVerified = await verifyLineSignature(sampleBody, "invalid-sig", secret);
  assert.equal(badVerified, false, "Invalid signature must fail");
  console.log("✓ Signature verification passed\n");

  console.log("=== [2] Testing Needle Intent Classification ===");
  const classifier = new NeedleClassifier(MOCK_ENV);

  const tests = [
    { input: "/你是誰", expected: "who_are_you" },
    { input: "/誰", expected: "who_are_you" },
    { input: "/about", expected: "who_are_you" },
    { input: "/tdx", expected: "show_tdx" },
    { input: "/交通部", expected: "show_tdx" },
    { input: "/運輸資料", expected: "show_tdx" },
    { input: "/app", expected: "show_motc_app" },
    { input: "/mini-app", expected: "show_motc_app" },
    { input: "/motc-mini-app", expected: "show_motc_app" },
    { input: "/周邊交通", expected: "show_motc_app" },
    { input: "/youbike", expected: "show_motc_app" },
    { input: "/project", expected: "show_projects" },
    { input: "/專案", expected: "show_projects" },
    { input: "/項目管理", expected: "show_projects" },
    { input: "/help", expected: "help" },
    { input: "/說明", expected: "help" },
    { input: "/申請", expected: "apply_test" },
    { input: "/測試", expected: "apply_test" },
    { input: "/form", expected: "apply_test" },
    { input: "/search", expected: "show_detective" },
    { input: "/偵探", expected: "show_detective" },
    { input: "/api", expected: "show_detective" },
    { input: "/feedback", expected: "submit_feedback" },
    { input: "/意見", expected: "submit_feedback" },
    { input: "/回報", expected: "submit_feedback" },
    { input: "/外部", expected: "show_projects" },
    { input: "/資源", expected: "show_projects" },
    { input: "/展示", expected: "show_projects" },
    { input: "/內部", expected: "show_projects" },
    { input: "/科資司", expected: "show_projects" },
    { input: "/internal", expected: "show_projects" }
  ];

  for (const { input, expected } of tests) {
    const res = await classifier.classify(input);
    assert.equal(res.tool, expected, `Routing for '${input}' should be '${expected}', got '${res.tool}'`);
    assert.equal(res.confidence, 1.0, `Confidence for exact pattern '${input}' should be 1.0`);
    console.log(`  ✓ '${input}' -> '${res.tool}' (confidence: ${res.confidence})`);
  }
  console.log("✓ Needle classification tests passed\n");

  console.log("=== [3] Testing Flex Message Generators ===");
  const tdxMsg = createTdxFlexMessage(MOCK_ENV.TDX_PORTAL_URL) as LineFlexMessage;
  assert.equal(tdxMsg.type, "flex");
  assert.equal(tdxMsg.altText, "🚍 TDX 交通部運輸資料流通服務官網");
  assert.ok(JSON.stringify(tdxMsg).includes("https://tdx.transportdata.tw/"));

  const miniAppMsg = createMiniAppFlexMessage(MOCK_ENV.MINI_APP_URL) as LineFlexMessage;
  assert.equal(miniAppMsg.type, "flex");
  assert.equal(miniAppMsg.altText, "📱 MOTC 雙旗艦 LINE Mini App 專區 (周邊交通 ＆ 資料小偵探)");
  assert.ok(JSON.stringify(miniAppMsg).includes("https://motc-mini-dog.pages.dev/"));

  const allProjectsMsg = createAllInclusiveProjectsFlexMessage("王季豪") as LineFlexMessage;
  assert.equal(allProjectsMsg.type, "flex");
  assert.ok(allProjectsMsg.altText.includes("15 大專案"));

  const externalProjectsMsg = createExternalProjectsFlexMessage("https://form.test") as LineFlexMessage;
  assert.equal(externalProjectsMsg.type, "flex");
  assert.ok(externalProjectsMsg.altText.includes("8 大公開平台"));

  const whoMsg = createWhoAreYouFlexMessage({
    tdxUrl: MOCK_ENV.TDX_PORTAL_URL!,
    miniAppUrl: MOCK_ENV.MINI_APP_URL!,
    projectUrl: MOCK_ENV.PROJECT_MGMT_URL!
  }) as LineFlexMessage;
  const formMsg = createFormFlexMessage("https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform") as LineFlexMessage;
  assert.equal(formMsg.type, "flex");
  assert.equal(formMsg.altText, "📝 填寫 MOTC 交通小助手測試開通申請表單");
  assert.ok(JSON.stringify(formMsg).includes("https://docs.google.com/forms"));
  assert.equal(whoMsg.type, "flex");
  assert.equal(whoMsg.altText, "🐶 哈囉！我是 MOTC 交通小助手");

  const helpMsg = createHelpFlexMessage({
    tdxUrl: MOCK_ENV.TDX_PORTAL_URL!,
    miniAppUrl: MOCK_ENV.MINI_APP_URL!,
    projectUrl: MOCK_ENV.PROJECT_MGMT_URL!
  }) as LineFlexMessage;
  assert.equal(helpMsg.type, "flex");
  const detectiveMsg = createDetectiveFlexMessage("https://miniapp.line.me/2011521041-JnfPdXhF", "https://motc-mini-dog.pages.dev/search") as LineFlexMessage;
  assert.equal(detectiveMsg.type, "flex");
  assert.equal(detectiveMsg.altText, "🕵️‍♂️ 資料查詢小偵探 (TDX 738+ API 探勘)");
  assert.ok(JSON.stringify(detectiveMsg).includes("motc-mini-search"));
  const ticketId = generateFeedbackTicketId("U1234567890abcdef");
  assert.match(ticketId, /^FB-\d{8}-\d{4}-[A-Z0-9]{4}$/, "Ticket ID format must match FB-YYYYMMDD-HHMM-XXXX");
  const feedbackUrl = buildPrefilledFeedbackFormUrl("U1234567890abcdef", "測試小明", ticketId);
  assert.ok(feedbackUrl.includes("entry.600472523=" + ticketId));
  assert.ok(feedbackUrl.includes("entry.431757759="));
  assert.ok(feedbackUrl.includes("entry.42197645="));

  const feedbackMsg = createFeedbackFlexMessage(ticketId, feedbackUrl) as LineFlexMessage;
  assert.equal(feedbackMsg.type, "flex");
  assert.ok(feedbackMsg.altText.includes(ticketId));
  console.log(`  ✓ Generated ticket ID: ${ticketId}`);
  console.log("✓ All Flex Message generators produced valid structures\n");

  console.log("=== [4] Testing HTTP Endpoints ===");
  // Health check
  const healthRes = await app.request("/health", {}, MOCK_ENV);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json() as { status: string; channelId: string };
  assert.equal(healthJson.status, "ok");
  assert.equal(healthJson.channelId, "2011514766");
  console.log("  ✓ GET /health returned 200 OK");

  // Webhook missing signature
  const noSigRes = await app.request("/webhook", {
    method: "POST",
    body: "{}"
  }, MOCK_ENV);
  assert.equal(noSigRes.status, 400);
  console.log("  ✓ POST /webhook without signature returned 400");

  // Webhook invalid signature
  const badSigRes = await app.request("/webhook", {
    method: "POST",
    headers: { "x-line-signature": "bogus" },
    body: "{}"
  }, MOCK_ENV);
  assert.equal(badSigRes.status, 401);
  console.log("  ✓ POST /webhook with bad signature returned 401");

  // Webhook valid signature
  const validWebhookBody = JSON.stringify({
    events: [
      {
        type: "message",
        replyToken: "mock-token",
        source: { type: "user", userId: "U123456" },
        message: { id: "1", type: "text", text: "哈囉吃飽沒" } // Normal speech without /
      }
    ]
  });
  const webhookSig = await generateLineSignature(validWebhookBody, MOCK_ENV.LINE_CHANNEL_SECRET);
  const okRes = await app.request("/webhook", {
    method: "POST",
    headers: { "x-line-signature": webhookSig },
    body: validWebhookBody
  }, MOCK_ENV, {
    waitUntil: (p: Promise<unknown>) => p,
    passThroughOnException: () => {},
    props: {}
  } as unknown as ExecutionContext);
  assert.equal(okRes.status, 200);
  console.log("  ✓ POST /webhook with valid signature returned 200");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
