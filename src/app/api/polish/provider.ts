interface ProviderConfig {
  url: string;
  model: string;
  apiKey: string;
  supportsJsonResponse: boolean;
}

const resolveProvider = (): "xai" | "openai" => {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "xai" || explicit === "openai") return explicit;
  if (process.env.XAI_API_KEY) return "xai";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.AI_API_KEY?.startsWith("xai-")) return "xai";
  return "openai";
};

export const getProvider = (): ProviderConfig | null => {
  const provider = resolveProvider();
  if (provider === "xai") {
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
