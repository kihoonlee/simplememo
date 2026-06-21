import { NextResponse, type NextRequest } from "next/server";
import { getDriveAccessToken } from "@/lib/auth-token";
import { getFolderId, setFolderId } from "@/lib/folder-store";
import { getMeta, createAppFolder } from "@/lib/drive/client";
import { folderSelectionSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/http";

export async function GET() {
  return NextResponse.json({ folderId: (await getFolderId()) ?? null });
}

export async function POST(req: NextRequest) {
  const auth = await getDriveAccessToken(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: unknown = await req.json().catch(() => null);
  const wantsCreate =
    typeof body === "object" &&
    body !== null &&
    (body as { create?: unknown }).create === true;

  // Fallback path: create a dedicated app folder in the user's Drive root.
  if (wantsCreate) {
    const rawName = (body as { name?: unknown }).name;
    const name =
      typeof rawName === "string" && rawName.trim()
        ? rawName.trim().slice(0, 100)
        : "SimpleMemo";
    try {
      const folderId = await createAppFolder(auth.token, name);
      await setFolderId(folderId);
      return NextResponse.json({ folderId });
    } catch (e) {
      const r = errorResponse(e);
      return NextResponse.json({ error: r.error }, { status: r.status });
    }
  }

  // Primary path: a folder chosen via the Google Picker.
  const parsed = folderSelectionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });

  try {
    // Confirm the app can reach the Picker-granted folder under drive.file.
    await getMeta(auth.token, parsed.data.folderId);
  } catch {
    return NextResponse.json(
      { error: "폴더에 접근할 수 없습니다. Picker로 다시 선택하세요" },
      { status: 403 },
    );
  }

  await setFolderId(parsed.data.folderId);
  return NextResponse.json({ folderId: parsed.data.folderId });
}
