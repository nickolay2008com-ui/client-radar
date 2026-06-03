import { analyzeThreads } from "../lib/analyze";
import { fetchRecentThreads } from "../lib/gmail";
import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  for (const user of users) {
    const threads = await fetchRecentThreads(user);
    const { report, rawOutput } = await analyzeThreads(threads);

    await prisma.report.create({
      data: {
        userId: user.id,
        items: report.items,
        rawOutput: rawOutput as object,
      },
    });

    console.log(`Saved report for ${user.email}: ${report.items.length} item(s).`);
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
