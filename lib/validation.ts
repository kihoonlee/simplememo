import { z } from "zod";

// Validate request bodies at the API boundary.

export const memoInputSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요").max(200),
  body: z.string().max(1_000_000).default(""),
  folder: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(100).default([]),
});
export type MemoInput = z.infer<typeof memoInputSchema>;

export const updateMemoSchema = memoInputSchema.extend({
  // Drive modifiedTime the client last saw; used to detect concurrent edits.
  baseModifiedTime: z.string().optional(),
});
export type UpdateMemoInput = z.infer<typeof updateMemoSchema>;

export const folderSelectionSchema = z.object({
  folderId: z.string().min(8).max(256),
  folderName: z.string().max(256).optional(),
});
export type FolderSelection = z.infer<typeof folderSelectionSchema>;
