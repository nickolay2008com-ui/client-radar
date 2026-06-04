import type { Prisma, Signal } from "@prisma/client";
import type { AnalyzedSignal } from "./analyze";
import { prisma } from "./prisma";

export type SaveSignalsInput = {
  userId: string;
  sourceId?: string | null;
  sourceType: string;
  externalId?: string | null;
  signals: AnalyzedSignal[];
};

function parseDueDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function findOrCreateSource(input: {
  userId: string;
  type: string;
  name: string;
  status?: string;
  config?: Prisma.InputJsonValue;
}) {
  const existing = await prisma.source.findFirst({
    where: { userId: input.userId, type: input.type, name: input.name },
  });

  if (existing) {
    return prisma.source.update({
      where: { id: existing.id },
      data: {
        status: input.status ?? existing.status,
        config: input.config ?? existing.config ?? undefined,
      },
    });
  }

  return prisma.source.create({
    data: {
      userId: input.userId,
      type: input.type,
      name: input.name,
      status: input.status ?? "active",
      config: input.config,
    },
  });
}

export async function findOrCreateDemoUser() {
  const email = "demo@radar.local";

  return prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
}

export async function saveSignals(input: SaveSignalsInput): Promise<Signal[]> {
  const saved: Signal[] = [];

  for (const signal of input.signals) {
    const data = {
      userId: input.userId,
      sourceId: input.sourceId ?? null,
      sourceType: input.sourceType,
      externalId: input.externalId ?? null,
      type: signal.type,
      priority: signal.priority,
      title: signal.title,
      contact: signal.contact,
      summary: signal.summary,
      risk: signal.risk,
      suggestedAction: signal.suggestedAction,
      suggestedReply: signal.suggestedReply,
      dueDate: parseDueDate(signal.dueDate),
    };

    if (input.sourceId && input.externalId) {
      const existing = await prisma.signal.findFirst({
        where: {
          sourceId: input.sourceId,
          externalId: input.externalId,
          type: signal.type,
          title: signal.title,
        },
      });

      if (existing) {
        saved.push(
          await prisma.signal.update({
            where: { id: existing.id },
            data,
          }),
        );
        continue;
      }
    }

    saved.push(await prisma.signal.create({ data }));
  }

  return saved;
}

export function toSignalResponse(signal: Signal) {
  return {
    id: signal.id,
    type: signal.type,
    priority: signal.priority,
    title: signal.title,
    contact: signal.contact,
    summary: signal.summary,
    risk: signal.risk,
    suggestedAction: signal.suggestedAction,
    suggestedReply: signal.suggestedReply,
    dueDate: signal.dueDate?.toISOString() ?? null,
    status: signal.status,
    sourceType: signal.sourceType,
  };
}
