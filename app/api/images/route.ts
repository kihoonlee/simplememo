import { NextResponse, type NextRequest } from "next/server";
import { getDriveAccessToken } from "@/lib/auth-token";
import { getFolderId } from "@/lib/folder-store";
import { ensureSubfolder, uploadImage } from "@/lib/drive/client";
import { errorResponse } from "@/lib/http";

const MAX_BYTES = 15 * 1024 * 1024;

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
      return NextResponse.json({ error: "이미지 파일이 없습니다" }, { status: 400 });
    if (file.size > MAX_BYTES)
      return NextResponse.json(
        { error: "이미지가 너무 큽니다 (최대 15MB)" },
        { status: 413 },
      );

    const imagesFolderId = await ensureSubfolder(auth.token, folderId, "images");
    const bytes = await file.arrayBuffer();
    const safeName = `${Date.now()}-${(file.name || "image").replace(/[^\w.\-]+/g, "_")}`;
    const { id, url } = await uploadImage(
      auth.token,
      imagesFolderId,
      safeName,
      bytes,
      file.type || "application/octet-stream",
    );
    return NextResponse.json({ id, url }, { status: 201 });
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
}
