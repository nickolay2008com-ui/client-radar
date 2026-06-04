import { analyzeInputForSignals } from "../lib/analyze";
import { fetchRecentThreads } from "../lib/gmail";
import { prisma } from "../lib/prisma";
import { findOrCreateSource, saveSignals, toSignalResponse } from "../lib/signals";

async function createDailyReport(userId: string) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const signals = await prisma.signal.findMany({
    where: {
      userId,
      status: "open",
      createdAt: { gte: since },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return prisma.dailyReport.create({
    data: {
      userId,
      signals: signals.map(toSignalResponse),
    },
  });
}

async function main() {
  const users = await prisma.user.findMany({
    where: { googleAccessToken: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  for (const user of users) {
    const threads = await fetchRecentThreads(user);
    const source = await findOrCreateSource({
      userId: user.id,
      type: "gmail",
      name: user.email ? `Gmail ${user.email}` : "Gmail",
    });

    let savedCount = 0;

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

      const saved = await saveSignals({
        userId: user.id,
        sourceId: source.id,
        sourceType: "gmail",
        externalId: thread.threadId,
        signals: analysis.signals,
      });
      savedCount += saved.length;
    }

    const dailySignals = (await createDailyReport(user.id)).signals;

    await prisma.report.create({
      data: {
        userId: user.id,
        items: dailySignals as object,
        rawOutput: { source: "signals" },
      },
    });

    console.log(`Saved daily report for ${user.email ?? user.id}: ${savedCount} signal(s).`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
