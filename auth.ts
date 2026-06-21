import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Full drive scope: required to write into a pre-existing user folder
// (SMEMO_FOLDER_ID) that the app did not create. drive.file cannot reach it.
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

// Auth.js v5 (App Router). Google sign-in with the least-privilege drive.file
// scope. Access/refresh tokens live in the encrypted JWT (server-side cookie),
// never on the client-visible session.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope: `openid email profile ${DRIVE_SCOPE}`,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: capture tokens from the provider.
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token ?? token.refresh_token;
        token.expires_at = account.expires_at;
        token.error = undefined;
        return token;
      }
      // Still valid (60s clock skew)?
      if (token.expires_at && Date.now() < token.expires_at * 1000 - 60_000) {
        return token;
      }
      // Expired — rotate via refresh token.
      if (!token.refresh_token) {
        token.error = "RefreshTokenError";
        return token;
      }
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
          }),
        });
        const data: {
          access_token?: string;
          expires_in?: number;
          refresh_token?: string;
        } = await res.json();
        if (!res.ok || !data.access_token) throw new Error("refresh failed");
        token.access_token = data.access_token;
        token.expires_at =
          Math.floor(Date.now() / 1000) + Number(data.expires_in ?? 3600);
        if (data.refresh_token) token.refresh_token = data.refresh_token;
        token.error = undefined;
        return token;
      } catch {
        token.error = "RefreshTokenError";
        return token;
      }
    },
    async session({ session, token }) {
      // Surface only auth health to the client — never the access token.
      session.error = token.error;
      return session;
    },
  },
});
