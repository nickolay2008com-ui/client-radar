import { NextRequest, NextResponse } from "next/server";
import { analyzeInputForSignals } from "../../../../lib/analyze";
import { prisma } from "../../../../lib/prisma";
import { findOrCreateSource, saveSignals } from "../../../../lib/signals";

type TelegramUpdate = {
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number | string };
    from?: { id?: number | string; first_name?: string; username?: string };
    date?: number;
  };
};

function formatReply(signals: Awaited<ReturnType<typeof saveSignals>>) {
  if (signals.length === 0) {
    return "Не нашёл явных дедлайнов, оплат, обещаний или срочных действий.";
  }

  const items = signals.map((signal, index) => {
    return `${index + 1}. [${signal.priority}] ${signal.title}\n   Тип: ${signal.type}\n   Что важно: ${signal.summary}\n   Риск: ${signal.risk ?? "—"}\n   Что сделать: ${signal.suggestedAction}\n   Готовый ответ: ${signal.suggestedReply ?? "—"}`;
  });

  return `Найдено важное:\n\n${items.join("\n\n")}`;
}

async function replyToTelegram(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incomingSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (configuredSecret && incomingSecret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid Telegram webhook secret." }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const text = message?.text?.trim();
  const telegramUserId = message?.from?.id?.toString();
  const chatId = message?.chat?.id;

  if (!message || !text || !telegramUserId || !chatId) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.upsert({
    where: { telegramUserId },
    create: { telegramUserId },
    update: {},
  });
  const source = await findOrCreateSource({
    userId: user.id,
    type: "telegram_bot",
    name: message.from?.username ? `Telegram @${message.from.username}` : "Telegram bot",
  });

  const externalId = message.message_id ? `telegram:${message.message_id}` : undefined;
  const { analysis } = await analyzeInputForSignals({
    sourceType: "telegram_bot",
    externalId,
    contact: message.from?.first_name ?? message.from?.username,
    date: message.date ? new Date(message.date * 1000).toISOString() : undefined,
    text,
  });

  const signals = await saveSignals({
    userId: user.id,
    sourceId: source.id,
    sourceType: "telegram_bot",
    externalId,
    signals: analysis.signals,
  });

  await replyToTelegram(chatId, formatReply(signals));

  return NextResponse.json({ ok: true, signals: signals.length });
}
