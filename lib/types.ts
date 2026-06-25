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
  excerpt?: string; // plain-text body preview for list cards
}

// A non-memo file uploaded to the same folder (opened via Drive, not the editor).
export interface FileItem {
  kind: "file";
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  mimeType?: string;
  size?: number;
}

// A row in the list: either a memo (.md, opens in the editor) or an uploaded file.
export type MemoListEntry = (MemoMeta & { kind: "memo" }) | FileItem;
