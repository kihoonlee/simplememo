import type { MemoMeta } from "@/lib/types";

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

export const api = {
  async listMemos(): Promise<MemoMeta[]> {
    const d = await json<{ memos: MemoMeta[] }>(await fetch("/api/memos"));
    return d.memos;
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
  async getFolder(): Promise<{ folderId: string | null }> {
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
