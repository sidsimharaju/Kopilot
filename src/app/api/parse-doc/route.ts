import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const filename = (req.nextUrl.searchParams.get("filename") || "").toLowerCase();
    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length) return NextResponse.json({ error: "empty body" }, { status: 400 });

    let text = "";
    if (filename.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result.value || "";
    } else {
      text = buf.toString("utf8");
    }

    text = text.replace(/\r\n/g, "\n").trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Parse doc error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
