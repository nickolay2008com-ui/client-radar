import { NextRequest, NextResponse } from "next/server";
import { analyzeInputForSignals } from "../../../../lib/analyze";
import { fetchRecentThreads } from "../../../../lib/gmail";
import { prisma } from "../../../../lib/prisma";
import { findOrCreateSource, saveSignals, toSignalResponse } from "../../../../lib/signals";

export async function GET(request: NextRequest) {
  const cookieUserId = request.cookies.get("client_radar_user_id")?.value;
  const user = cookieUserId
    ? await prisma.user.findUnique({ where: { id: cookieUserId } })
    : await prisma.user.findFirst({ where: { googleAccessToken: { not: null } }, orderBy: { createdAt: "desc" } });

  if (!user) {
    return NextResponse.json({ error: "No connected Gmail user found." }, { status: 404 });
  }

  const threads = await fetchRecentThreads(user);
  const source = await findOrCreateSource({
    userId: user.id,
    type: "gmail",
    name: user.email ? `Gmail ${user.email}` : "Gmail",
  });

  for (const thread of threads) {
    const { analysis } = await analyzeInputForSignals({
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
    });

    await saveSignals({
      userId: user.id,
      sourceId: source.id,
      sourceType: "gmail",
      externalId: thread.threadId,
      signals: analysis.signals,
    });
  }

  const signals = await prisma.signal.findMany({
    where: { userId: user.id, status: "open" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const savedReport = await prisma.dailyReport.create({
    data: {
      userId: user.id,
      signals: signals.map(toSignalResponse),
    },
  });

  return NextResponse.json({
    reportId: savedReport.id,
    createdAt: savedReport.createdAt,
    signals: signals.map(toSignalResponse),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
