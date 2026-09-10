import type { OutgoingLineMessage } from "../types/line";

const LINE_API_BASE = "https://api.line.me/v2/bot";
const LINE_OAUTH_TOKEN_URL = "https://api.line.me/v2/oauth/accessToken";

// In-memory token cache across worker warm invocations
let cachedToken: { token: string; expiresAt: number } | null = null;

export class LineClient {
  private accessToken?: string;
  private channelId?: string;
  private channelSecret?: string;

  constructor(options: { accessToken?: string; channelId?: string; channelSecret?: string }) {
    this.accessToken = options.accessToken;
    this.channelId = options.channelId;
    this.channelSecret = options.channelSecret;
  }

  /**
   * Acquire a valid Channel Access Token, either from configured token or via OAuth client_credentials.
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.trim().length > 0) {
      return this.accessToken;
    }

    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now + 60000) {
      return cachedToken.token;
    }

    if (!this.channelId || !this.channelSecret) {
      throw new Error("Missing LINE channel credentials (channelId/channelSecret or accessToken required)");
    }

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.channelId,
      client_secret: this.channelSecret
    });

    const response = await fetch(LINE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to issue LINE Channel Access Token: ${response.status} ${errText}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in || 2592000) * 1000
    };
    return data.access_token;
  }

  /**
   * Reply to a message event using replyToken.
   */
  async reply(replyToken: string, messages: OutgoingLineMessage[] | OutgoingLineMessage): Promise<boolean> {
    if (!replyToken) return false;

    const token = await this.getAccessToken();
    const payload = {
      replyToken,
      messages: Array.isArray(messages) ? messages : [messages]
    };

    try {
      const response = await fetch(`${LINE_API_BASE}/message/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[LineClient] Reply failed (${response.status}):`, errorText);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[LineClient] Reply network error:", error);
      return false;
    }
  }

  /**
   * Push a message directly to a user ID.
   */
  async push(toUserId: string, messages: OutgoingLineMessage[] | OutgoingLineMessage): Promise<boolean> {
    if (!toUserId) return false;

    const token = await this.getAccessToken();
    const payload = {
      to: toUserId,
      messages: Array.isArray(messages) ? messages : [messages]
    };

    try {
      const response = await fetch(`${LINE_API_BASE}/message/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[LineClient] Push failed (${response.status}):`, errorText);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[LineClient] Push network error:", error);
      return false;
    }
  }

  /**
   * Reply first; if reply fails, fallback to push.
   */
  async replyOrPush(
    replyToken: string | undefined,
    toUserId: string | undefined,
    messages: OutgoingLineMessage[] | OutgoingLineMessage
  ): Promise<boolean> {
    if (replyToken) {
      const success = await this.reply(replyToken, messages);
      if (success) return true;
    }
    if (toUserId) {
      return await this.push(toUserId, messages);
    }
    return false;
  }

  /**
   * Show LINE loading animation while processing.
   */
  async showLoading(chatId: string, loadingSeconds: number = 20): Promise<void> {
    if (!chatId) return;

    try {
      const token = await this.getAccessToken();
      await fetch(`${LINE_API_BASE}/chat/loading/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId,
          loadingSeconds: Math.min(Math.max(loadingSeconds, 5), 60)
        })
      });
    } catch (error) {
      console.warn("[LineClient] showLoading failed:", error);
    }
  }

  /**
   * Get user profile (displayName, pictureUrl) from LINE Messaging API.
   */
  async getProfile(userId: string): Promise<{ userId: string; displayName: string; pictureUrl?: string } | null> {
    if (!userId) return null;
    try {
      const token = await this.getAccessToken();
      const resp = await fetch(`${LINE_API_BASE}/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return null;
      return (await resp.json()) as { userId: string; displayName: string; pictureUrl?: string };
    } catch (error) {
      console.warn("[LineClient] getProfile error:", error);
      return null;
    }
  }
}
