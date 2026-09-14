import { Hono } from "hono";
import type { Env } from "../types/env";
import type { LineWebhookPayload } from "../types/line";
import { verifyLineSignature } from "../line/verifier";
import { verifyLineIdToken } from "../line/jwt";
import { processLineEvent } from "../services/commandProcessor";
import { NeedleClassifier } from "../classifier/needle";

export const webhookRouter = new Hono<{ Bindings: Env }>();

/**
 * LINE Messaging API Webhook
 */
webhookRouter.post("/webhook", async (c) => {
  const signature = c.req.header("x-line-signature");
  const rawBody = await c.req.text();

  if (!signature) {
    return c.text("Missing x-line-signature header", 400);
  }

  const isValid = await verifyLineSignature(rawBody, signature, c.env.LINE_CHANNEL_SECRET);
  if (!isValid) {
    console.warn("[Webhook] Invalid LINE signature rejected");
    return c.text("Invalid signature", 401);
  }

  let payload: LineWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.text("Malformed JSON payload", 400);
  }

  const events = payload.events || [];

  // Dispatch events asynchronously using ctx.waitUntil
  for (const event of events) {
    c.executionCtx.waitUntil(processLineEvent(event, c.env));
  }

  // Return 200 OK immediately to satisfy LINE webhook requirements
  return c.text("OK", 200);
});

/**
 * Health Check & Environment Status
 */
webhookRouter.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "motc-line-bot-worker",
    environment: c.env.ENVIRONMENT || "development",
    channelId: c.env.LINE_CHANNEL_ID,
    featureFlags: {
      silverCare: c.env.FEATURE_SILVER_CARE_ENABLED ?? "true",
      eagleEye: c.env.FEATURE_EAGLE_EYE_ENABLED ?? "true",
      detective: c.env.FEATURE_DETECTIVE_ENABLED ?? "true",
      projects: c.env.FEATURE_PROJECTS_ENABLED ?? "true"
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * LIFF ID Token (JWT) Authentication Endpoint
 * Verifies identity token from Mini Apps (liff.getIDToken())
 */
webhookRouter.post("/api/auth/verify", async (c) => {
  let token = "";

  // 1. Check Authorization header
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check JSON Body fallback
  if (!token) {
    try {
      const body = await c.req.json<{ idToken?: string }>();
      token = body?.idToken || "";
    } catch {
      // Body may not be JSON
    }
  }

  if (!token) {
    return c.json({ valid: false, error: "Missing idToken in Authorization header or body" }, 400);
  }

  const allowedChannels = [
    c.env.LINE_CHANNEL_ID,
    c.env.DEV_LINE_CHANNEL_ID,
    c.env.PROD_LINE_CHANNEL_ID,
    "2011556606", // Developing senior care
    "2011556608", // Published senior care
    "2011551329", // Developing eagle eye
    "2011551331", // Published eagle eye
    "2011521041", // Developing search
    "2011521043", // Published search
    "2011514766"  // Bot worker channel
  ].filter(Boolean) as string[];

  const result = await verifyLineIdToken(token, allowedChannels);

  if (!result.valid) {
    return c.json({ valid: false, error: result.error }, 401);
  }

  return c.json({
    valid: true,
    userId: result.userId,
    displayName: result.displayName,
    picture: result.picture,
    email: result.email,
    environment: c.env.ENVIRONMENT || "development"
  });
});

/**
 * Needle Intent Classifier Test Endpoint (Diagnostic / CI)
 */
webhookRouter.post("/test/classify", async (c) => {
  const body = await c.req.json<{ text: string }>();
  const text = body.text || "";

  const startsWithSlash = text.trim().startsWith("/");
  const classifier = new NeedleClassifier(c.env);
  const result = await classifier.classify(text);

  return c.json({
    input: text,
    processed: startsWithSlash,
    intent: result
  });
});
