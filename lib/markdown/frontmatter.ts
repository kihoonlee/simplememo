import matter from "gray-matter";
import type { Memo, MemoFrontmatter } from "@/lib/types";

// YAML parsers turn unquoted ISO timestamps into Date objects. Coerce any
// shape (Date | string | other) back to an ISO string, falling back when empty.
function toIso(value: unknown, fallback: string): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

// Build the `.md` file contents (YAML frontmatter + body) for a memo.
export function serializeMemo(fm: MemoFrontmatter, body: string): string {
  const data: Record<string, unknown> = {
    title: fm.title,
    created: fm.created,
    updated: fm.updated,
    tags: fm.tags ?? [],
  };
  if (fm.folder && fm.folder.trim()) data.folder = fm.folder;
  return matter.stringify(body ?? "", data);
}

// Parse raw `.md` contents into a Memo, tolerating missing/partial frontmatter.
export function parseMemo(id: string, raw: string): Memo {
  const { data, content } = matter(raw ?? "");
  const epoch = new Date(0).toISOString();
  const created = toIso(data.created, epoch);
  return {
    id,
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title
        : "(제목 없음)",
    created,
    updated: toIso(data.updated, created),
    folder:
      typeof data.folder === "string" && data.folder.trim()
        ? data.folder
        : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : [],
    body: content.replace(/^\n+/, ""),
  };
}

// Plain-text preview of the markdown body for list cards (strips md syntax).
export function makeExcerpt(body: string, max = 100): string {
  const text = (body ?? "")
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> link text
    .replace(/^#{1,6}\s+/gm, "") // heading markers
    .replace(/[*_~>#|]/g, " ") // residual md symbols
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

// Parse the frontmatter + a body preview for the list/index (no full body).
export function parseMeta(
  id: string,
  name: string,
  raw: string,
  modifiedTime?: string,
): import("@/lib/types").MemoMeta {
  const memo = parseMemo(id, raw);
  return {
    id,
    name,
    title: memo.title,
    created: memo.created,
    updated: memo.updated,
    folder: memo.folder,
    tags: memo.tags,
    modifiedTime,
    excerpt: makeExcerpt(memo.body),
  };
}
