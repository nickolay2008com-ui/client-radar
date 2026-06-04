import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "../../../../lib/crypto";
import { findOrCreateDemoUser, findOrCreateSource } from "../../../../lib/signals";

const providers = new Set(["yandex", "mailru", "gmail_imap", "custom"]);

type ConnectBody = {
  email?: string;
  provider?: string;
  imapHost?: string;
  imapPort?: number | string;
  imapSecure?: boolean;
  username?: string;
  appPassword?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ConnectBody;
  const provider = body.provider?.trim() || "custom";
  const email = body.email?.trim();
  const imapHost = body.imapHost?.trim();
  const username = body.username?.trim();
  const appPassword = body.appPassword;
  const imapPort = Number(body.imapPort);

  if (!providers.has(provider)) {
    return NextResponse.json({ error: "Unsupported provider." }, { status: 400 });
  }

  if (!email || !imapHost || !username || !appPassword || !Number.isInteger(imapPort)) {
    return NextResponse.json({ error: "Email, IMAP host, port, username and app password are required." }, { status: 400 });
  }

  const user = await findOrCreateDemoUser();
  const source = await findOrCreateSource({
    userId: user.id,
    type: "imap_email",
    name: `${provider}: ${email}`,
    status: "active",
    config: {
      email,
      provider,
      imapHost,
      imapPort,
      imapSecure: Boolean(body.imapSecure),
      username,
      encryptedAppPassword: encrypt(appPassword),
    },
  });

  return NextResponse.json({
    source: {
      id: source.id,
      type: source.type,
      name: source.name,
      status: source.status,
    },
  });
}
