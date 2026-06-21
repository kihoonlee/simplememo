import { cookies } from "next/headers";

const KEY = "sm_folder";
const ONE_YEAR = 60 * 60 * 24 * 365;

// The selected target Drive folder id is kept in an httpOnly cookie (single-user
// app, no database). Set once after the Google Picker selection.
export async function getFolderId(): Promise<string | undefined> {
  return (await cookies()).get(KEY)?.value;
}

export async function setFolderId(id: string): Promise<void> {
  (await cookies()).set(KEY, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
