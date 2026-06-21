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

// Parse only the frontmatter for the list/index (cheaper, ignores body).
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
  };
}
