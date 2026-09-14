export interface Env {
  // Environment Variables
  ENVIRONMENT?: string;
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN?: string;

  // URLs
  TDX_PORTAL_URL?: string;
  MINI_APP_URL?: string;
  PROJECT_MGMT_URL?: string;
  DEMO_APP_URL?: string;
  GOOGLE_FORM_URL?: string;
  FEEDBACK_FORM_URL?: string;
  DETECTIVE_LIFF_URL?: string;
  DETECTIVE_WEB_URL?: string;
  EAGLE_EYE_LIFF_URL?: string;
  EAGLE_EYE_WEB_URL?: string;
  SENIOR_CARE_LIFF_URL?: string;
  TRAFFIC_LIFF_URL?: string;
  GUARDIAN_WEB_URL?: string;
  APPS_SCRIPT_AUTH_URL?: string;
  KNOWN_INTERNAL_USER_IDS?: string;

  // Feature Flags (for graceful rollout and instant rollback)
  FEATURE_SILVER_CARE_ENABLED?: string;
  FEATURE_EAGLE_EYE_ENABLED?: string;
  FEATURE_DETECTIVE_ENABLED?: string;
  FEATURE_PROJECTS_ENABLED?: string;

  // Multi-environment Channel IDs for JWT verification
  DEV_LINE_CHANNEL_ID?: string;
  PROD_LINE_CHANNEL_ID?: string;

  // AI & Classifier
  NEEDLE_API_URL?: string;
  NEEDLE_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

export type BotToolName =
  | "show_tdx"
  | "show_motc_app"
  | "show_web_portal"
  | "show_unified_form"
  | "show_detective"
  | "show_projects"
  | "who_are_you"
  | "show_silver_protect"
  | "show_eagle_eye"
  | "help"
  | "apply_test"
  | "submit_feedback"
  | "ai_chat"
  | "unknown";

export interface RoutingResult {
  tool: BotToolName;
  arguments?: Record<string, unknown>;
  confidence: number;
  reasoning?: string;
}

export interface ToolDefinition {
  name: BotToolName;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}
