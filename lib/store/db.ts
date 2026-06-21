import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// Local draft persistence so in-progress edits survive reloads / network blips.
// Keyed by memo id, with "new" reserved for an unsaved new memo.

export interface Draft {
  id: string;
  title: string;
  body: string;
  folder?: string;
  tags: string[];
  savedAt: number;
  baseModifiedTime?: string;
}

interface SmemoDB extends DBSchema {
  drafts: { key: string; value: Draft };
}

let dbp: Promise<IDBPDatabase<SmemoDB>> | null = null;

function db(): Promise<IDBPDatabase<SmemoDB>> {
  if (!dbp) {
    dbp = openDB<SmemoDB>("simplememo", 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains("drafts")) {
          d.createObjectStore("drafts", { keyPath: "id" });
        }
      },
    });
  }
  return dbp;
}

export async function saveDraft(draft: Draft): Promise<void> {
  try {
    await (await db()).put("drafts", draft);
  } catch {
    // Best-effort; never block the editor on a storage failure.
  }
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  try {
    return await (await db()).get("drafts", id);
  } catch {
    return undefined;
  }
}

export async function clearDraft(id: string): Promise<void> {
  try {
    await (await db()).delete("drafts", id);
  } catch {
    // ignore
  }
}
