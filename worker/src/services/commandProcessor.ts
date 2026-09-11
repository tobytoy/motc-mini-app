import type { Env } from "../types/env";
import type { LineEvent, LineTextMessage } from "../types/line";
import { LineClient } from "../line/client";
import { NeedleClassifier } from "../classifier/needle";
import { AiRouter } from "../classifier/aiRouter";
import {
  createTdxFlexMessage,
  createMiniAppFlexMessage,
  createWhoAreYouFlexMessage,
  createHelpFlexMessage,
  createFormFlexMessage,
  createDetectiveFlexMessage,
  buildPrefilledGoogleFormUrl,
  generateFeedbackTicketId,
  buildPrefilledFeedbackFormUrl,
  createFeedbackFlexMessage,
  createAllInclusiveProjectsFlexMessage,
  createExternalProjectsFlexMessage,
  createEagleEyeFlexMessage
} from "../line/templates";

export async function processLineEvent(event: LineEvent, env: Env): Promise<void> {
  const lineClient = new LineClient({
    accessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    channelId: env.LINE_CHANNEL_ID,
    channelSecret: env.LINE_CHANNEL_SECRET
  });

  const tdxUrl = env.TDX_PORTAL_URL || "https://tdx.transportdata.tw/";
  const miniAppUrl = env.MINI_APP_URL || "https://motc-mini-dog.pages.dev/";
  const projectUrl = env.PROJECT_MGMT_URL || "https://ai.studio/apps/0bd118d7-407b-4576-bf5b-e354f697c2cf";
  const demoAppUrl = env.DEMO_APP_URL || "https://ai.studio/apps/1d7b8b11-885e-4bcd-947e-a77325ac06f6?fullscreenApplet=true";
  const detectiveLiffUrl = env.DETECTIVE_LIFF_URL || "https://miniapp.line.me/2011521041-JnfPdXhF";
  const detectiveWebUrl = env.DETECTIVE_WEB_URL || "https://motc-mini-dog.pages.dev/search";
  const eagleEyeLiffUrl = env.EAGLE_EYE_LIFF_URL || "https://miniapp.line.me/2011551329-VWljb6fv";
  const eagleEyeWebUrl = env.EAGLE_EYE_WEB_URL || "https://motc-mini-dog.pages.dev/eagle-eye";

  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // Fetch user display name from LINE to auto prefill form
  let userDisplayName = "";
  if (userId && userId !== "anonymous") {
    const profile = await lineClient.getProfile(userId);
    if (profile?.displayName) {
      userDisplayName = profile.displayName;
    }
  }
  const formUrl = buildPrefilledGoogleFormUrl(userId, userDisplayName);
  const feedbackTicketId = generateFeedbackTicketId(userId);
  const feedbackFormUrl = buildPrefilledFeedbackFormUrl(userId, userDisplayName, feedbackTicketId);
  const urlBundle = { tdxUrl, miniAppUrl, projectUrl, formUrl, detectiveLiffUrl, detectiveWebUrl, feedbackFormUrl, feedbackTicketId };
  try {
    // 1. Handle Follow Event (User adds bot as friend)
    if (event.type === "follow") {
      if (replyToken) {
        await lineClient.reply(replyToken, createWhoAreYouFlexMessage(urlBundle));
      }
      return;
    }

    // 2. Handle Location Sharing
    if (event.type === "message" && event.message?.type === "location") {
      // User tapped "傳送我的位置", provide direct link to Mini App
      if (replyToken) {
        await lineClient.reply(replyToken, createMiniAppFlexMessage(miniAppUrl));
      }
      return;
    }

    // 3. Handle Text Messages
    if (event.type === "message" && event.message?.type === "text") {
      const textMsg = event.message as LineTextMessage;
      const rawText = textMsg.text.trim();

      // STRICT RULE: Only process messages starting with "/"
      // "一般說話 你就不要理他"
      if (!rawText.startsWith("/")) {
        // Do not reply at all
        return;
      }

      if (!replyToken) {
        return;
      }

      // Show loading animation in chat if userId exists
      if (userId) {
        await lineClient.showLoading(userId, 5);
      }

      // Classify intent using Needle
      const classifier = new NeedleClassifier(env);
      const aiRouter = new AiRouter(env.GEMINI_API_KEY);

      const routingResult = await classifier.classify(rawText, (prompt) =>
        aiRouter.routeWithGemini(prompt)
      );

      switch (routingResult.tool) {
        case "show_tdx":
          await lineClient.reply(replyToken, createTdxFlexMessage(tdxUrl));
          break;

        case "show_motc_app":
          await lineClient.reply(replyToken, createMiniAppFlexMessage(miniAppUrl, detectiveLiffUrl, formUrl));
          break;

        case "show_detective":
          await lineClient.reply(replyToken, createDetectiveFlexMessage(detectiveLiffUrl, detectiveWebUrl));
          break;

        case "show_eagle_eye":
          await lineClient.reply(replyToken, createEagleEyeFlexMessage(eagleEyeLiffUrl, eagleEyeWebUrl));
          break;
        case "show_projects": {
          let isInternal = false;
          const knownIds = (env.KNOWN_INTERNAL_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
          console.log(`[InternalAuth] Checking user ${userId}; whitelist has ${knownIds.length} users.`);
          if (userId && knownIds.includes(userId)) {
            isInternal = true;
            console.log(`[InternalAuth] User ${userId} verified via KNOWN_INTERNAL_USER_IDS whitelist.`);
          } else if (userId && env.APPS_SCRIPT_AUTH_URL) {
            try {
              console.log(`[InternalAuth] Querying Apps Script for ${userId}...`);
              const authResp = await fetch(`${env.APPS_SCRIPT_AUTH_URL}?userId=${encodeURIComponent(userId)}`, {
                signal: AbortSignal.timeout(8000),
              });
              if (authResp.ok) {
                const authData = (await authResp.json()) as { isInternal?: boolean; displayName?: string };
                console.log(`[InternalAuth] Apps Script response for ${userId}:`, JSON.stringify(authData));
                if (authData.isInternal) {
                  isInternal = true;
                  if (authData.displayName && !userDisplayName) {
                    userDisplayName = authData.displayName;
                  }
                }
              } else {
                console.warn(`[InternalAuth] Apps Script returned HTTP ${authResp.status}`);
              }
            } catch (e) {
              console.warn("[InternalAuth] Failed to verify via Apps Script:", e);
            }
          }

          if (isInternal) {
            // 內部同仁：24 大系統全部顯示 (13 內部 + 11 外部)
            await lineClient.reply(replyToken, createAllInclusiveProjectsFlexMessage(userDisplayName, demoAppUrl));
          } else {
            // 非內部人員：只會顯示 11 大外部公開平台，附內部開通申請
            await lineClient.reply(replyToken, createExternalProjectsFlexMessage(formUrl));
          }
          break;
        }

        case "who_are_you":
          await lineClient.reply(replyToken, createWhoAreYouFlexMessage(urlBundle));
          break;

        case "apply_test":
          await lineClient.reply(replyToken, createFormFlexMessage(formUrl));
          break;

        case "submit_feedback":
          await lineClient.reply(replyToken, createFeedbackFlexMessage(feedbackTicketId, feedbackFormUrl));
          break;

        case "help":
          await lineClient.reply(replyToken, createHelpFlexMessage(urlBundle));
          break;
      }
    }
  } catch (error) {
    console.error("[processLineEvent] Error handling event:", error);
  }
}
