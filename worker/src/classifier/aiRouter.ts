import type { RoutingResult, BotToolName } from "../types/env";
import { BOT_TOOLS } from "./tools";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class AiRouter {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Route query with Gemini Function Calling API.
   */
  async routeWithGemini(userPrompt: string): Promise<RoutingResult> {
    if (!this.apiKey) {
      return {
        tool: "who_are_you",
        confidence: 0.5,
        reasoning: "No Gemini API key configured, falling back to who_are_you"
      };
    }

    const systemInstruction = `You are an intent classification engine for a MOTC LINE Bot assistant.
Your task is to select the single best tool from the provided function declarations that matches the user prompt.
- Use "show_tdx" for queries asking about TDX official website, MOTC transport open data, or TDX API portal.
- Use "show_motc_app" for queries asking about the MOTC Mini App, nearby YouBike, parking spaces, bus arrival, or navigation map.
- Use "show_project_manager" for queries asking about project management dashboard, ai.studio app, development progress, or task board.
- Use "who_are_you" for questions about bot identity or introduction.
- Use "help" for general help, list of commands, or instructions.`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      tools: [
        {
          functionDeclarations: BOT_TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }))
        }
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: "ANY",
          allowedFunctionNames: BOT_TOOLS.map((t) => t.name)
        }
      }
    };

    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

    for (const model of models) {
      try {
        const response = await fetch(
          `${GEMINI_API_BASE}/models/${model}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          continue;
        }

        const data = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                functionCall?: {
                  name: string;
                  args?: Record<string, unknown>;
                };
              }>;
            };
          }>;
        };

        const call = data.candidates?.[0]?.content?.parts?.[0]?.functionCall;
        if (call && call.name) {
          return {
            tool: call.name as BotToolName,
            arguments: call.args || {},
            confidence: 0.9,
            reasoning: `Classified via Gemini (${model})`
          };
        }
      } catch (err) {
        console.warn(`[AiRouter] Error with ${model}:`, err);
      }
    }

    return {
      tool: "who_are_you",
      confidence: 0.5,
      reasoning: "Gemini routing failed to match, defaulting to who_are_you"
    };
  }
}
