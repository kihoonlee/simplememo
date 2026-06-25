import { NextResponse, type NextRequest } from "next/server";
import { getDriveAccessToken } from "@/lib/auth-token";
import { getFolderId } from "@/lib/folder-store";
import {
  listMarkdown,
  listMarkdownPage,
  readFile,
  createTextFile,
} from "@/lib/drive/client";
import { parseMeta, serializeMemo } from "@/lib/markdown/frontmatter";
import { slugify, uniqueFilename } from "@/lib/markdown/slug";
import { memoInputSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/http";
import type { MemoMeta } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = await getDriveAccessToken(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const folderId = await getFolderId();
  if (!folderId)
    return NextResponse.json(
      { error: "폴더가 선택되지 않았습니다", code: "NO_FOLDER" },
      { status: 409 },
    );

  const url = new URL(req.url);
  const pageToken = url.searchParams.get("pageToken") ?? undefined;
  const PAGE_SIZE = 10;

  try {
    // Only this page's files have their content read (newest first), so the
    // initial list is fast even when the folder holds many memos.
    const { files, nextPageToken } = await listMarkdownPage(
      auth.token,
      folderId,
      PAGE_SIZE,
      pageToken,
    );
    const memos: MemoMeta[] = await Promise.all(
      files.map(async (f) =>
        parseMeta(f.id, f.name, await readFile(auth.token, f.id), f.modifiedTime),
      ),
    );
    return NextResponse.json({ memos, nextPageToken: nextPageToken ?? null });
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
}

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

  const parsed = memoInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });

  try {
    const now = new Date().toISOString();
    const existing = new Set(
      (await listMarkdown(auth.token, folderId)).map((f) => f.name),
    );
    const name = uniqueFilename(slugify(parsed.data.title), existing);
    const md = serializeMemo(
      {
        title: parsed.data.title,
        created: now,
        updated: now,
        folder: parsed.data.folder,
        tags: parsed.data.tags,
      },
      parsed.data.body,
    );
    const file = await createTextFile(auth.token, folderId, name, md);
    return NextResponse.json(
      { id: file.id, name: file.name, modifiedTime: file.modifiedTime },
      { status: 201 },
    );
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
}
