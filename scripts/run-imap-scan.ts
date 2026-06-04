import net from "net";
import tls from "tls";
import { analyzeInputForSignals } from "../lib/analyze";
import { decrypt } from "../lib/crypto";
import { prisma } from "../lib/prisma";
import { saveSignals } from "../lib/signals";

type ImapConfig = {
  email: string;
  provider: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  encryptedAppPassword: string;
};

type ParsedEmail = {
  externalId: string;
  subject: string;
  from: string;
  date: string;
  text: string;
};

class MinimalImapClient {
  private socket: net.Socket | tls.TLSSocket | null = null;
  private buffer = "";
  private tagCounter = 0;

  constructor(private readonly config: ImapConfig & { appPassword: string }) {}

  async connect() {
    this.socket = this.config.imapSecure
      ? tls.connect({ host: this.config.imapHost, port: this.config.imapPort, servername: this.config.imapHost })
      : net.connect({ host: this.config.imapHost, port: this.config.imapPort });

    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk) => {
      this.buffer += chunk.toString();
    });

    await this.waitFor(/\* OK/i);
    await this.command(`LOGIN ${this.quote(this.config.username)} ${this.quote(this.config.appPassword)}`);
    await this.command("SELECT INBOX");
  }

  async fetchRecentRaw(limit = 30) {
    const search = await this.command("SEARCH SINCE " + this.sinceDate());
    const ids = Array.from(search.matchAll(/\* SEARCH ([\d\s]*)/g))
      .flatMap((match) => match[1].trim().split(/\s+/).filter(Boolean))
      .slice(-limit);

    const messages: string[] = [];

    for (const id of ids) {
      const response = await this.command(`FETCH ${id} BODY.PEEK[]`);
      messages.push(response);
    }

    return messages;
  }

  async logout() {
    if (!this.socket) {
      return;
    }

    try {
      await this.command("LOGOUT");
    } finally {
      this.socket.end();
    }
  }

  private command(command: string) {
    if (!this.socket) {
      throw new Error("IMAP socket is not connected.");
    }

    const tag = `A${++this.tagCounter}`;
    this.buffer = "";
    this.socket.write(`${tag} ${command}\r\n`);

    return this.waitFor(new RegExp(`${tag} (OK|NO|BAD)`, "i")).then((response) => {
      if (new RegExp(`${tag} (NO|BAD)`, "i").test(response)) {
        throw new Error(`IMAP command failed: ${command.replace(/LOGIN .*/i, "LOGIN [redacted]")}`);
      }

      return response;
    });
  }

  private waitFor(pattern: RegExp, timeoutMs = 30_000) {
    return new Promise<string>((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (pattern.test(this.buffer)) {
          clearInterval(timer);
          resolve(this.buffer);
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          clearInterval(timer);
          reject(new Error("IMAP command timed out."));
        }
      }, 50);
    });
  }

  private quote(value: string) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }

  private sinceDate() {
    const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getUTCDate()}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
  }
}

function header(raw: string, name: string) {
  const match = raw.match(new RegExp(`^${name}:\\s*([^\\r\\n]*(?:\\r?\\n[ \\t][^\\r\\n]*)*)`, "im"));
  return match?.[1].replace(/\r?\n[ \t]/g, " ").trim() ?? "";
}

function stripMime(raw: string) {
  const body = raw.split(/\r?\n\r?\n/).slice(1).join("\n\n");
  return body
    .replace(/--[\w'()+_,.\/:=?-]+/g, " ")
    .replace(/Content-[^\n]+/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function parseEmail(rawFetchResponse: string, fallbackId: string): ParsedEmail {
  const raw = rawFetchResponse.replace(/^[\s\S]*?\r?\n(?=[\w-]+:)/, "");
  const messageId = header(raw, "Message-ID") || fallbackId;
  const subject = header(raw, "Subject");
  const from = header(raw, "From");
  const date = header(raw, "Date");

  return {
    externalId: messageId,
    subject,
    from,
    date,
    text: stripMime(raw),
  };
}

function isImapConfig(value: unknown): value is ImapConfig {
  const config = value as Partial<ImapConfig> | null;

  return Boolean(
    config &&
      typeof config.imapHost === "string" &&
      typeof config.imapPort === "number" &&
      typeof config.imapSecure === "boolean" &&
      typeof config.username === "string" &&
      typeof config.encryptedAppPassword === "string",
  );
}

async function scanSource(source: { id: string; userId: string; config: unknown }) {
  if (!isImapConfig(source.config)) {
    return;
  }

  const client = new MinimalImapClient({ ...source.config, appPassword: decrypt(source.config.encryptedAppPassword) });
  await client.connect();

  try {
    const rawMessages = await client.fetchRecentRaw(30);

    for (let index = 0; index < rawMessages.length; index += 1) {
      const email = parseEmail(rawMessages[index], `${source.id}:${index}`);
      const duplicate = await prisma.signal.findFirst({
        where: { sourceId: source.id, externalId: email.externalId },
      });

      if (duplicate) {
        continue;
      }

      const { analysis } = await analyzeInputForSignals({
        sourceType: "imap_email",
        externalId: email.externalId,
        title: email.subject,
        contact: email.from,
        date: email.date,
        text: [`Subject: ${email.subject}`, `From: ${email.from}`, `Date: ${email.date}`, email.text].join("\n"),
      });

      await saveSignals({
        userId: source.userId,
        sourceId: source.id,
        sourceType: "imap_email",
        externalId: email.externalId,
        signals: analysis.signals,
      });
    }
  } finally {
    await client.logout();
  }
}

async function main() {
  const sources = await prisma.source.findMany({
    where: { type: "imap_email", status: "active" },
    select: { id: true, userId: true, config: true },
  });

  for (const source of sources) {
    await scanSource(source);
    console.log(`Scanned IMAP source ${source.id}.`);
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
