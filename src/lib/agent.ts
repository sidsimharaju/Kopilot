const AGENT_TEXT_SYSTEM =
  "You are a research operations assistant. Write like a colleague on Slack: warm, direct, short sentences, no em dashes, no corporate language. Return plain text only.";

type AgentResponse = { content?: Array<{ type: string; text: string }>; error?: string };

async function postAgent(body: {
  system?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  max_tokens?: number;
}): Promise<string> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as AgentResponse;
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data.content?.[0]?.text ?? "";
}

/** Call the agent expecting plain text back. */
export async function callAgentText(
  prompt: string,
  opts: { system?: string; max_tokens?: number } = {},
): Promise<string> {
  return postAgent({
    system: opts.system ?? AGENT_TEXT_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    max_tokens: opts.max_tokens,
  });
}

/** Call the agent expecting a JSON object back. Tolerates fenced markdown. */
export async function callAgentJSON<T = unknown>(
  prompt: string,
  opts: { system?: string; max_tokens?: number } = {},
): Promise<T> {
  const text = await postAgent({
    system: opts.system,
    messages: [{ role: "user", content: prompt }],
    max_tokens: opts.max_tokens,
  });
  return parseAgentJSON<T>(text);
}

export function parseAgentJSON<T = unknown>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence ? fence[1] : text).trim();
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  const slice = first !== -1 && last !== -1 ? candidate.slice(first, last + 1) : candidate;
  return JSON.parse(slice) as T;
}
