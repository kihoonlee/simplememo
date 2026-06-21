import { NextResponse, type NextRequest } from "next/server";
import { getDriveAccessToken } from "@/lib/auth-token";
import {
  getMeta,
  readFile,
  updateTextFile,
  trashFile,
} from "@/lib/drive/client";
import { parseMemo, serializeMemo } from "@/lib/markdown/frontmatter";
import { updateMemoSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await getDriveAccessToken(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const [content, meta] = await Promise.all([
      readFile(auth.token, id),
      getMeta(auth.token, id),
    ]);
    const memo = parseMemo(id, content);
    return NextResponse.json({
      id,
      name: meta.name,
      modifiedTime: meta.modifiedTime,
      title: memo.title,
      folder: memo.folder ?? null,
      tags: memo.tags,
      body: memo.body,
      created: memo.created,
    });
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await getDriveAccessToken(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = updateMemoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });

  try {
    const meta = await getMeta(auth.token, id);
    if (
      parsed.data.baseModifiedTime &&
      meta.modifiedTime &&
      meta.modifiedTime !== parsed.data.baseModifiedTime
    ) {
      return NextResponse.json(
        {
          error: "다른 곳에서 먼저 수정되었습니다",
          code: "CONFLICT",
          modifiedTime: meta.modifiedTime,
        },
        { status: 409 },
      );
    }
    // Preserve original created timestamp.
    const existing = parseMemo(id, await readFile(auth.token, id));
    const md = serializeMemo(
      {
        title: parsed.data.title,
        created: existing.created,
        updated: new Date().toISOString(),
        folder: parsed.data.folder,
        tags: parsed.data.tags,
      },
      parsed.data.body,
    );
    const file = await updateTextFile(auth.token, id, md);
    return NextResponse.json({
      id: file.id,
      name: file.name,
      modifiedTime: file.modifiedTime,
    });
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await getDriveAccessToken(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    await trashFile(auth.token, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const r = errorResponse(e);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
}
