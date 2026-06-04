import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getGoogleOAuthClient } from "../../../../../lib/google";
import { requireEnv } from "../../../../../lib/env";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing Google OAuth code." }, { status: 400 });
  }

  const oauth2Client = getGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    return NextResponse.json({ error: "Google did not return an access token." }, { status: 400 });
  }

  oauth2Client.setCredentials(tokens);
  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token ?? "",
    audience: requireEnv("GOOGLE_CLIENT_ID"),
  });
  const email = ticket.getPayload()?.email;

  if (!email) {
    return NextResponse.json({ error: "Google account email was not available." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
    update: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token ?? existingUser?.googleRefreshToken,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : existingUser?.googleTokenExpiry,
    },
  });

  await prisma.source.upsert({
    where: { id: `${user.id}:gmail` },
    create: {
      id: `${user.id}:gmail`,
      userId: user.id,
      type: "gmail",
      name: `Gmail ${email}`,
      status: "active",
    },
    update: {
      name: `Gmail ${email}`,
      status: "active",
    },
  });

  const response = NextResponse.redirect(new URL("/success", request.nextUrl.origin));
  response.cookies.set("client_radar_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
