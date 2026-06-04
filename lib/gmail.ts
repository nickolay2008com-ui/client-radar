import type { User } from "@prisma/client";
import { google, gmail_v1 } from "googleapis";
import { prisma } from "./prisma";
import { getGoogleOAuthClient } from "./google";

export type GmailThread = {
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function findPlainTextBody(part?: gmail_v1.Schema$MessagePart): string {
  if (!part) {
    return "";
  }

  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }

  for (const child of part.parts ?? []) {
    const body = findPlainTextBody(child);

    if (body) {
      return body;
    }
  }

  return "";
}

function toThreadSummary(thread: gmail_v1.Schema$Thread): GmailThread | null {
  const messages = thread.messages ?? [];
  const latestMessage = messages[messages.length - 1];

  if (!thread.id || !latestMessage) {
    return null;
  }

  const headers = latestMessage.payload?.headers;

  return {
    threadId: thread.id,
    subject: getHeader(headers, "subject"),
    from: getHeader(headers, "from"),
    to: getHeader(headers, "to"),
    date: getHeader(headers, "date"),
    snippet: latestMessage.snippet ?? "",
    body: findPlainTextBody(latestMessage.payload).slice(0, 4000),
  };
}

export async function refreshGoogleTokenIfNeeded(user: User): Promise<User> {
  const expiresAt = user.googleTokenExpiry?.getTime() ?? 0;
  const shouldRefresh = Boolean(user.googleRefreshToken) && expiresAt < Date.now() + 60_000;

  if (!shouldRefresh) {
    return user;
  }

  if (!user.googleAccessToken) {
    throw new Error("User does not have a Google access token.");
  }

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return prisma.user.update({
    where: { id: user.id },
    data: {
      googleAccessToken: credentials.access_token ?? user.googleAccessToken,
      googleRefreshToken: credentials.refresh_token ?? user.googleRefreshToken,
      googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : user.googleTokenExpiry,
    },
  });
}

export async function fetchRecentThreads(user: User): Promise<GmailThread[]> {
  const freshUser = await refreshGoogleTokenIfNeeded(user);
  if (!freshUser.googleAccessToken) {
    return [];
  }

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: freshUser.googleAccessToken,
    refresh_token: freshUser.googleRefreshToken,
    expiry_date: freshUser.googleTokenExpiry?.getTime(),
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const list = await gmail.users.threads.list({
    userId: "me",
    q: "newer_than:14d",
    maxResults: 30,
  });

  const threadIds = list.data.threads?.map((thread) => thread.id).filter((id): id is string => Boolean(id)) ?? [];
  const threads = await Promise.all(
    threadIds.map(async (id) => {
      const response = await gmail.users.threads.get({
        userId: "me",
        id,
        format: "full",
      });

      return toThreadSummary(response.data);
    }),
  );

  return threads.filter((thread): thread is GmailThread => Boolean(thread));
}
