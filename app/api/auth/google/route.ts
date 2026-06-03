import { NextResponse } from "next/server";
import { getGoogleOAuthClient, googleOAuthScopes } from "../../../../lib/google";

export async function GET() {
  const oauth2Client = getGoogleOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: googleOAuthScopes,
  });

  return NextResponse.redirect(url);
}
