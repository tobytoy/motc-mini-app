import { getGridCacheStats } from "./nearby";

export interface Env {
  TDX_CLIENT_ID: string;
  TDX_CLIENT_SECRET: string;
  CWA_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ENABLE_GEMINI_ADVICE?: string;
  TRANSPORT_DATA_SOURCE?: string;
  TRANSPORT_MCP_BASE_URL?: string;
  TRANSPORT_MCP_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return new Response(
    JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "motc-mini-app-backend",
      hasTdxId: Boolean(context.env.TDX_CLIENT_ID),
      hasTdxSecret: Boolean(context.env.TDX_CLIENT_SECRET),
      hasCwaKey: Boolean(context.env.CWA_API_KEY),
      geminiAdviceEnabled: context.env.ENABLE_GEMINI_ADVICE === "true" || context.env.ENABLE_GEMINI_ADVICE === "1",
      dataSource: (context.env.TRANSPORT_DATA_SOURCE || "direct").toLowerCase(),
      mcpConfigured: Boolean(context.env.TRANSPORT_MCP_BASE_URL),
      gridCache: getGridCacheStats(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    }
  );
};
