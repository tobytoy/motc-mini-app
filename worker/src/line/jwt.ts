/**
 * LINE LIFF ID Token (JWT) Verifier
 * 
 * Verifies JWT tokens issued by LINE Login / LIFF (liff.getIDToken())
 * Validates issuer (https://access.line.me), audience (Channel ID), expiration,
 * and optionally verifies cryptographic signature against LINE's verification endpoint.
 */

export interface LineIdTokenPayload {
  iss: string;
  sub: string; // Real, verified LINE User ID (e.g. U1234567890abcdef)
  aud: string; // Channel ID
  exp: number; // Expiration timestamp in seconds
  iat?: number;
  name?: string;
  picture?: string;
  email?: string;
}

export interface VerifyTokenResult {
  valid: boolean;
  userId?: string;
  displayName?: string;
  picture?: string;
  email?: string;
  payload?: LineIdTokenPayload;
  error?: string;
}

/**
 * Base64URL decoder compatible with Cloudflare Workers (Web Crypto) supporting full UTF-8
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Safely parse the JWT payload without remote signature check.
 */
export function parseJwtPayload(token: string): LineIdTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson) as LineIdTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies a LINE ID Token.
 * 
 * @param idToken The JWT token obtained from liff.getIDToken()
 * @param channelId Expected Channel ID or array of valid Channel IDs (dev / prod)
 * @param options Optional configuration
 */
export async function verifyLineIdToken(
  idToken: string,
  channelId: string | string[],
  options: {
    verifyRemote?: boolean;
    nowSeconds?: number;
    timeoutMs?: number;
  } = {}
): Promise<VerifyTokenResult> {
  if (!idToken || typeof idToken !== "string") {
    return { valid: false, error: "Missing or invalid idToken" };
  }

  // 1. Structure check and Base64URL decode
  const payload = parseJwtPayload(idToken);
  if (!payload) {
    return { valid: false, error: "Malformed JWT token structure" };
  }

  // 2. Issuer check
  if (payload.iss !== "https://access.line.me") {
    return { valid: false, error: `Invalid issuer: ${payload.iss}, expected https://access.line.me` };
  }

  // 3. Audience check (Channel ID matching)
  const allowedChannels = Array.isArray(channelId) ? channelId : [channelId];
  if (!allowedChannels.includes(payload.aud)) {
    return {
      valid: false,
      error: `Audience mismatch: token audience ${payload.aud} does not match allowed channels [${allowedChannels.join(", ")}]`
    };
  }

  // 4. Expiration check
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return {
      valid: false,
      error: `Token expired at ${payload.exp}, current time is ${now}`
    };
  }

  // 5. Remote signature verification with LINE API (if requested or in live mode)
  if (options.verifyRemote) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

      const params = new URLSearchParams();
      params.append("id_token", idToken);
      params.append("client_id", payload.aud);

      const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString(),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        return { valid: false, error: `LINE verify endpoint rejected token: ${errorText}` };
      }

      const verifiedData = (await response.json()) as LineIdTokenPayload;
      return {
        valid: true,
        userId: verifiedData.sub,
        displayName: verifiedData.name,
        picture: verifiedData.picture,
        email: verifiedData.email,
        payload: verifiedData
      };
    } catch (remoteErr) {
      console.warn("[LINE JWT] Remote verify failed or timed out:", remoteErr);
      return { valid: false, error: `Remote verification failed: ${String(remoteErr)}` };
    }
  }

  // Local validation passed
  return {
    valid: true,
    userId: payload.sub,
    displayName: payload.name,
    picture: payload.picture,
    email: payload.email,
    payload
  };
}
