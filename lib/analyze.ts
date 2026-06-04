import OpenAI from "openai";
import type { GmailThread } from "./gmail";
import { requireEnv } from "./env";

export const signalTypes = [
  "missed_follow_up",
  "unanswered_question",
  "payment_risk",
  "deadline",
  "forgotten_promise",
  "opportunity_risk",
  "document_risk",
  "subscription_risk",
  "government_deadline",
  "legal_deadline",
  "general_reminder",
] as const;

export const signalPriorities = ["low", "medium", "high", "urgent"] as const;

export type SignalType = (typeof signalTypes)[number];
export type SignalPriority = (typeof signalPriorities)[number];

export type SignalAnalysisInput = {
  sourceType: string;
  externalId?: string | null;
  title?: string;
  contact?: string;
  date?: string;
  text: string;
  metadata?: Record<string, unknown>;
};

export type AnalyzedSignal = {
  type: SignalType;
  priority: SignalPriority;
  title: string;
  contact: string | null;
  summary: string;
  risk: string | null;
  suggestedAction: string;
  suggestedReply: string | null;
  dueDate: string | null;
};

export type SignalAnalysis = {
  signals: AnalyzedSignal[];
};

export type ReportItemType = Extract<
  SignalType,
  "missed_follow_up" | "unanswered_question" | "payment_risk" | "deadline" | "forgotten_promise" | "opportunity_risk"
>;

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

const systemPrompt = `You are Radar AI, an assistant that finds important actions in email, messengers, and pasted text.
Return strict JSON only in this shape: {"signals": []}.
Support Russian and English.
Do not invent facts.
If no important item is detected, return {"signals": []}.
Every signal must be understandable without reading the original source.
Prioritize deadlines, payments, promises, client replies, legal/government deadlines, documents, subscriptions, risks, and forgotten follow-ups.
Use only these signal types: ${signalTypes.join(", ")}.
Use only these priorities: ${signalPriorities.join(", ")}.
dueDate must be ISO date/date-time string or null if exact date is unclear.
Use camelCase keys: type, priority, title, contact, summary, risk, suggestedAction, suggestedReply, dueDate.`;

function normalizePriority(value: unknown): SignalPriority {
  return signalPriorities.includes(value as SignalPriority) ? (value as SignalPriority) : "medium";
}

function normalizeType(value: unknown): SignalType {
  return signalTypes.includes(value as SignalType) ? (value as SignalType) : "general_reminder";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeParseSignals(content: string): SignalAnalysis {
  const parsed = JSON.parse(content) as { signals?: unknown };

  if (!Array.isArray(parsed.signals)) {
    return { signals: [] };
  }

  const signals = parsed.signals
    .filter((signal): signal is Record<string, unknown> => Boolean(signal) && typeof signal === "object")
    .map((signal) => ({
      type: normalizeType(signal.type),
      priority: normalizePriority(signal.priority),
      title: requiredString(signal.title, "Важное действие"),
      contact: nullableString(signal.contact),
      summary: requiredString(signal.summary, "Найдено важное действие."),
      risk: nullableString(signal.risk),
      suggestedAction: requiredString(signal.suggestedAction, "Проверить сообщение и выполнить следующее действие."),
      suggestedReply: nullableString(signal.suggestedReply),
      dueDate: nullableString(signal.dueDate),
    }));

  return { signals };
}

export async function analyzeInputForSignals(
  input: SignalAnalysisInput | SignalAnalysisInput[],
): Promise<{ analysis: SignalAnalysis; rawOutput: unknown }> {
  const inputs = Array.isArray(input) ? input : [input];
  const usefulInputs = inputs.filter((item) => item.text.trim());

  if (usefulInputs.length === 0) {
    return { analysis: { signals: [] }, rawOutput: { signals: [] } };
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
          instructions: "Analyze these inputs and return only strict JSON with a signals array.",
          inputs: usefulInputs,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message.content ?? "{\"signals\": []}";
  return { analysis: safeParseSignals(content), rawOutput: JSON.parse(content) };
}

function threadToInput(thread: GmailThread): SignalAnalysisInput {
  return {
    sourceType: "gmail",
    externalId: thread.threadId,
    title: thread.subject,
    contact: thread.from,
    date: thread.date,
    text: [
      `Subject: ${thread.subject}`,
      `From: ${thread.from}`,
      `To: ${thread.to}`,
      `Date: ${thread.date}`,
      `Snippet: ${thread.snippet}`,
      thread.body,
    ].join("\n"),
  };
}

function signalToReportItem(signal: AnalyzedSignal): ReportItem {
  return {
    type: signal.type as ReportItemType,
    priority: signal.priority === "urgent" ? "high" : signal.priority,
    contact: signal.contact ?? "",
    subject: signal.title,
    summary: signal.summary,
    risk: signal.risk ?? "",
    suggested_action: signal.suggestedAction,
    suggested_reply: signal.suggestedReply ?? "",
  };
}

export async function analyzeThreads(threads: GmailThread[]): Promise<{ report: ReportAnalysis; rawOutput: unknown }> {
  const { analysis, rawOutput } = await analyzeInputForSignals(threads.map(threadToInput));
  const legacyTypes = new Set<ReportItemType>([
    "missed_follow_up",
    "unanswered_question",
    "payment_risk",
    "deadline",
    "forgotten_promise",
    "opportunity_risk",
  ]);

  return {
    report: { items: analysis.signals.filter((signal) => legacyTypes.has(signal.type as ReportItemType)).map(signalToReportItem) },
    rawOutput,
  };
}
