import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const secureCookie = process.env.NODE_ENV === "production";
const cookieName = secureCookie
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export type DriveTokenResult =
  | { ok: true; token: string }
  | { ok: false; status: number; error: string };

// Read the Google access token from the encrypted session cookie, server-side
// only. Returns 401 details when the user is signed out or needs to re-auth.
export async function getDriveAccessToken(
  req: NextRequest,
): Promise<DriveTokenResult> {
  const jwt = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    salt: cookieName,
    cookieName,
    secureCookie,
  });
  if (!jwt) return { ok: false, status: 401, error: "로그인이 필요합니다" };
  if (jwt.error === "RefreshTokenError" || !jwt.access_token) {
    return {
      ok: false,
      status: 401,
      error: "구글 인증이 만료되었습니다. 다시 로그인하세요",
    };
  }
  return { ok: true, token: jwt.access_token };
}
