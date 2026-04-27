import type { ProviderConfig } from "./providerTypes";

export const sendCompletion = (
  provider: ProviderConfig,
  system: string,
  user: string,
  jsonMode: boolean,
): Promise<Response> => {
  const payload: Record<string, unknown> = {
    model: provider.model,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (jsonMode) payload.response_format = { type: "json_object" };
  return fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
};
