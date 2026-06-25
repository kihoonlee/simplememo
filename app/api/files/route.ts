import { NextResponse, type NextRequest } from "next/server";
import { getDriveAccessToken } from "@/lib/auth-token";
import { getFolderId } from "@/lib/folder-store";
import { uploadFile } from "@/lib/drive/client";
import { errorResponse } from "@/lib/http";

// Vercel's serverless request body cap is ~4.5MB; stay safely under it.
const MAX_BYTES = 4 * 1024 * 1024;

// Upload an arbitrary file into the memo folder, independent of memo creation.
export async function POST(req: NextRequest) {
  const auth = await getDriveAccessToken(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const folderId = await getFolderId();
  if (!folderId)
    return NextResponse.json(
      { error: "폴더가 선택되지 않았습니다", code: "NO_FOLDER" },
      { status: 409 },
    );

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    if (file.size === 0)
      return NextResponse.json(
        { error: "빈 파일은 업로드할 수 없습니다" },
        { status: 400 },
      );
    if (file.size > MAX_BYTES)
      return NextResponse.json(
        { error: "파일이 너무 큽니다 (최대 4MB)" },
        { status: 413 },
      );

    const safeName = (file.name || "file").replace(/[/\\]+/g, "_").slice(0, 200);
    const bytes = await file.arrayBuffer();
    const f = await uploadFile(
      auth.token,
      folderId,
      safeName,
      bytes,
      file.type || "application/octet-stream",
    );
    return NextResponse.json({ id: f.id, name: f.name }, { status: 201 });
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
}
