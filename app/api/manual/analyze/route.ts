import { NextRequest, NextResponse } from "next/server";
import { analyzeInputForSignals } from "../../../../lib/analyze";
import { findOrCreateDemoUser, findOrCreateSource, saveSignals, toSignalResponse } from "../../../../lib/signals";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { text?: string; sourceName?: string };
  const text = body.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const user = await findOrCreateDemoUser();
  const source = await findOrCreateSource({
    userId: user.id,
    type: "manual_text",
    name: body.sourceName?.trim() || "Manual paste",
  });

  const { analysis } = await analyzeInputForSignals({
    sourceType: "manual_text",
    title: body.sourceName?.trim() || "Manual paste",
    text,
  });

  const signals = await saveSignals({
    userId: user.id,
    sourceId: source.id,
    sourceType: "manual_text",
    signals: analysis.signals,
  });

  return NextResponse.json({ signals: signals.map(toSignalResponse) });
}
