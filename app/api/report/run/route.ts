import { NextRequest, NextResponse } from "next/server";
import { analyzeThreads } from "../../../../lib/analyze";
import { fetchRecentThreads } from "../../../../lib/gmail";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  const cookieUserId = request.cookies.get("client_radar_user_id")?.value;
  const user = cookieUserId
    ? await prisma.user.findUnique({ where: { id: cookieUserId } })
    : await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });

  if (!user) {
    return NextResponse.json({ error: "No connected Gmail user found." }, { status: 404 });
  }

  const threads = await fetchRecentThreads(user);
  const { report, rawOutput } = await analyzeThreads(threads);
  const savedReport = await prisma.report.create({
    data: {
      userId: user.id,
      items: report.items,
      rawOutput: rawOutput as object,
    },
  });

  return NextResponse.json({
    reportId: savedReport.id,
    createdAt: savedReport.createdAt,
    items: report.items,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
