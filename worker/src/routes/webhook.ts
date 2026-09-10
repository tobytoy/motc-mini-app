import { Hono } from "hono";
import type { Env } from "../types/env";
import type { LineWebhookPayload } from "../types/line";
import { verifyLineSignature } from "../line/verifier";
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
 * Health Check
 */
webhookRouter.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "motc-line-bot-worker",
    environment: c.env.ENVIRONMENT || "production",
    channelId: c.env.LINE_CHANNEL_ID,
    timestamp: new Date().toISOString()
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
