import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type AgentMessage = { role: "system" | "user" | "assistant"; content: string };
type AgentBody = { messages?: AgentMessage[]; system?: string; max_tokens?: number };

export async function POST(req: NextRequest) {
  const { messages, system, max_tokens } = (await req.json()) as AgentBody;
  if (!messages) return NextResponse.json({ error: "messages required" }, { status: 400 });

  const openaiMessages: AgentMessage[] = [];
  if (system) openaiMessages.push({ role: "system", content: system });
  openaiMessages.push(...messages);

  try {
    const apiKey = (process.env.OPENAI_API_KEY || "").replace(/^Bearer\s+/i, "").trim();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: max_tokens || 4000,
        messages: openaiMessages,
      }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });

    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Agent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
