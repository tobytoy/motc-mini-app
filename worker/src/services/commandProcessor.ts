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
  createExternalProjectsFlexMessage
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
  const detectiveLiffUrl = env.DETECTIVE_LIFF_URL || "https://miniapp.line.me/2011521041-JnfPdXhF";
  const detectiveWebUrl = env.DETECTIVE_WEB_URL || "https://motc-mini-dog.pages.dev/search";

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
        case "show_projects": {
          let isInternal = false;
          const knownIds = (env.KNOWN_INTERNAL_USER_IDS || "").split(",").map((s) => s.trim());
          if (userId && knownIds.includes(userId)) {
            isInternal = true;
          } else if (userId && env.APPS_SCRIPT_AUTH_URL) {
            try {
              const authResp = await fetch(`${env.APPS_SCRIPT_AUTH_URL}?userId=${encodeURIComponent(userId)}`, {
                signal: AbortSignal.timeout(3000),
              });
              if (authResp.ok) {
                const authData = (await authResp.json()) as { isInternal?: boolean; displayName?: string };
                if (authData.isInternal) {
                  isInternal = true;
                  if (authData.displayName && !userDisplayName) {
                    userDisplayName = authData.displayName;
                  }
                }
              }
            } catch (e) {
              console.warn("[InternalAuth] Failed to verify via Apps Script:", e);
            }
          }

          if (isInternal) {
            // 內部同仁：15 大系統全部顯示 (7 內部 + 8 外部)
            await lineClient.reply(replyToken, createAllInclusiveProjectsFlexMessage(userDisplayName));
          } else {
            // 非內部人員：只會顯示 8 大外部公開專案，附內部開通申請
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
          // Fallback to self-introduction and command list
          await lineClient.reply(replyToken, createWhoAreYouFlexMessage(urlBundle));
          break;
      }
    }
  } catch (error) {
    console.error("[processLineEvent] Error handling event:", error);
  }
}
