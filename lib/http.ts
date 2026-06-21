import { DriveError } from "@/lib/drive/client";

// Map internal errors to safe client responses (no raw Drive detail leaks).
export function errorResponse(e: unknown): { status: number; error: string } {
  if (e instanceof DriveError) {
    if (e.status === 401 || e.status === 403)
      return { status: e.status, error: "드라이브 접근 권한이 없습니다" };
    if (e.status === 404)
      return { status: 404, error: "파일을 찾을 수 없습니다" };
    return { status: 502, error: "드라이브 요청에 실패했습니다" };
  }
  return { status: 500, error: "서버 오류가 발생했습니다" };
}
