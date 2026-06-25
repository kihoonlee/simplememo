import type { MemoListEntry } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function json<T>(res: Response): Promise<T> {
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { error?: string; code?: string };
    throw new ApiError(res.status, d.error ?? "요청에 실패했습니다", d.code);
  }
  return data as T;
}

export interface MemoWrite {
  title: string;
  body: string;
  folder?: string;
  tags: string[];
}

export interface MemoContent {
  id: string;
  name: string;
  modifiedTime?: string;
  title: string;
  folder: string | null;
  tags: string[];
  body: string;
  created: string;
}

export interface SaveResult {
  id: string;
  name: string;
  modifiedTime?: string;
}

export interface MemoPage {
  items: MemoListEntry[];
  nextPageToken: string | null;
}

export const api = {
  // One page of list entries — memos and uploaded files (newest first). Omit
  // pageToken for the first page; pass the previous nextPageToken for the next.
  async listMemos(pageToken?: string): Promise<MemoPage> {
    const url = pageToken
      ? `/api/memos?pageToken=${encodeURIComponent(pageToken)}`
      : "/api/memos";
    return json<MemoPage>(await fetch(url));
  },
  // Upload an arbitrary file into the memo folder (independent of memos).
  async uploadFile(file: File): Promise<{ id: string; name: string }> {
    const fd = new FormData();
    fd.append("file", file, file.name);
    return json(await fetch("/api/files", { method: "POST", body: fd }));
  },
  async getMemo(id: string): Promise<MemoContent> {
    return json(await fetch(`/api/memos/${encodeURIComponent(id)}`));
  },
  async createMemo(input: MemoWrite): Promise<SaveResult> {
    return json(
      await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  },
  async updateMemo(
    id: string,
    input: MemoWrite & { baseModifiedTime?: string },
  ): Promise<SaveResult> {
    return json(
      await fetch(`/api/memos/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  },
  async deleteMemo(id: string): Promise<void> {
    await json(
      await fetch(`/api/memos/${encodeURIComponent(id)}`, { method: "DELETE" }),
    );
  },
  async getFolder(): Promise<{
    folderId: string | null;
    folderName?: string;
    folderLink?: string | null;
  }> {
    return json(await fetch("/api/folder"));
  },
  async setFolder(folderId: string, folderName?: string): Promise<{ folderId: string }> {
    return json(
      await fetch("/api/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, folderName }),
      }),
    );
  },
  async createAppFolder(name = "SimpleMemo"): Promise<{ folderId: string }> {
    return json(
      await fetch("/api/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ create: true, name }),
      }),
    );
  },
  async uploadImage(
    file: Blob,
    filename = "image.png",
  ): Promise<{ id: string; url: string }> {
    const fd = new FormData();
    fd.append("file", file, filename);
    return json(await fetch("/api/images", { method: "POST", body: fd }));
  },
};
