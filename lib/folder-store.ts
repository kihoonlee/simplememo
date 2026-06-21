import { cookies } from "next/headers";

const KEY = "sm_folder";
const ONE_YEAR = 60 * 60 * 24 * 365;

// When SMEMO_FOLDER_ID is set, ALL memos are forced into that Drive folder and
// the Picker/cookie is ignored. Requires the full `drive` OAuth scope because
// the folder is pre-existing (not app-created).
const FORCED_FOLDER = process.env.SMEMO_FOLDER_ID?.trim() || undefined;

export async function getFolderId(): Promise<string | undefined> {
  if (FORCED_FOLDER) return FORCED_FOLDER;
  return (await cookies()).get(KEY)?.value;
}

export async function setFolderId(id: string): Promise<void> {
  if (FORCED_FOLDER) return; // folder is forced — ignore Picker/app-folder selections
  (await cookies()).set(KEY, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
