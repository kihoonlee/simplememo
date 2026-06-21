// Filename slug helpers. Drive filenames may contain Unicode, so we keep
// letters/numbers from any language (Korean included) and collapse the rest.

export function slugify(title: string): string {
  const base = (title || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return base || "memo";
}

export function memoFilename(slug: string): string {
  return `${slug}.md`;
}

// Pick a filename that does not collide with existing names in the folder.
export function uniqueFilename(slug: string, existing: Set<string>): string {
  let name = memoFilename(slug);
  let i = 2;
  while (existing.has(name)) {
    name = `${slug}-${i}.md`;
    i += 1;
  }
  return name;
}
