import OpenAI from "openai";
import type { GmailThread } from "./gmail";
import { requireEnv } from "./env";

export type ReportItemType =
  | "missed_follow_up"
  | "unanswered_question"
  | "payment_risk"
  | "deadline"
  | "forgotten_promise"
  | "opportunity_risk";

export type ReportItem = {
  type: ReportItemType;
  priority: "high" | "medium" | "low";
  contact: string;
  subject: string;
  summary: string;
  risk: string;
  suggested_action: string;
  suggested_reply: string;
};

export type ReportAnalysis = {
  items: ReportItem[];
};

const systemPrompt = `You are Client Radar, an AI assistant for freelancers.
Analyze recent Gmail threads.
Find unresolved client-related obligations, missed replies, payment risks, deadlines, promises, and warm leads going cold.
Return strict JSON only.
Do not invent facts.
If there are no important items, return {"items": []}.`;

function safeParseReport(content: string): ReportAnalysis {
  const parsed = JSON.parse(content) as Partial<ReportAnalysis>;

  if (!Array.isArray(parsed.items)) {
    return { items: [] };
  }

  return { items: parsed.items as ReportItem[] };
}

export async function analyzeThreads(threads: GmailThread[]): Promise<{ report: ReportAnalysis; rawOutput: unknown }> {
  if (threads.length === 0) {
    return { report: { items: [] }, rawOutput: { items: [] } };
  }

  const client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          instructions: "Return only JSON in the required Client Radar format.",
          allowedTypes: [
            "missed_follow_up",
            "unanswered_question",
            "payment_risk",
            "deadline",
            "forgotten_promise",
            "opportunity_risk",
          ],
          threads,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message.content ?? "{\"items\": []}";
  const report = safeParseReport(content);

  return { report, rawOutput: JSON.parse(content) };
}
