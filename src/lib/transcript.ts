export const TRANSCRIPT_ACCEPT =
  ".txt,.docx,.vtt,.srt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/vtt";

const TRANSCRIPT_EXTS = ["txt", "docx", "vtt", "srt"];

export function isSupportedTranscriptFile(name: string): boolean {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return TRANSCRIPT_EXTS.includes(ext);
}

function stripCaptionMarkup(input: string): string {
  // Keep the cue timestamps (e.g. "00:00:01.000 --> 00:00:05.000") so they
  // show in the transcript; only strip the WEBVTT header, cue numbers, and
  // inline markup tags.
  return input
    .replace(/\r\n/g, "\n")
    .replace(/^WEBVTT.*$/im, "")
    .replace(/^\d+\s*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function readTranscriptUpload(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const isDocx = ext === "docx";
  const res = await fetch(
    `/api/parse-doc?filename=${encodeURIComponent(file.name)}`,
    { method: "POST", body: await file.arrayBuffer() },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { text?: string };
  const raw = data.text ?? "";
  if (isDocx) return raw.trim();
  return stripCaptionMarkup(raw);
}
