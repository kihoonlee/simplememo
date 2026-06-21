// Domain types shared across the app.

export interface MemoFrontmatter {
  title: string;
  created: string; // ISO 8601
  updated: string; // ISO 8601
  folder?: string; // logical folder (stored in frontmatter, not a Drive subfolder)
  tags: string[];
}

// A full memo: frontmatter + markdown body, identified by its Drive file id.
export interface Memo extends MemoFrontmatter {
  id: string; // Drive fileId
  body: string; // markdown body without the frontmatter block
}

// Lightweight list/index entry (no body) used for the memo list and search index.
export interface MemoMeta extends MemoFrontmatter {
  id: string; // Drive fileId
  name: string; // Drive filename, e.g. "출시-회고.md"
  modifiedTime?: string; // Drive modifiedTime (RFC 3339) for conflict detection
}
