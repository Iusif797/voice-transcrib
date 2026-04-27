import type { ProviderConfig } from "./providerTypes";

const resolveProvider = (): "xai" | "openai" => {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "xai" || explicit === "openai") return explicit;
  const key = process.env.AI_API_KEY;
  if (key?.startsWith("xai-")) return "xai";
  if (key?.startsWith("sk-")) return "openai";
  if (process.env.XAI_API_KEY) return "xai";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "openai";
};

export const getProvider = (): ProviderConfig | null => {
  const kind = resolveProvider();
  if (kind === "xai") {
    const apiKey = process.env.XAI_API_KEY ?? process.env.AI_API_KEY;
    if (!apiKey) return null;
    return {
      url: "https://api.x.ai/v1/chat/completions",
      model: process.env.AI_MODEL ?? "grok-4-latest",
      apiKey,
      supportsJsonResponse: true,
    };
  }
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
  if (!apiKey) return null;
  return {
    url: "https://api.openai.com/v1/chat/completions",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    apiKey,
    supportsJsonResponse: true,
  };
};
