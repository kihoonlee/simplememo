"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { saveDraft, clearDraft } from "@/lib/store/db";
import EditorPane from "./EditorPane";
import { ArrowLeftIcon, TrashIcon, FolderIcon, HashIcon } from "./icons";

type Status = "idle" | "saving" | "saved" | "error" | "conflict";

const STATUS_LABEL: Record<Status, string> = {
  idle: "편집 중",
  saving: "저장 중…",
  saved: "드라이브에 저장됨",
  error: "저장 실패",
  conflict: "수정 충돌",
};

export default function MemoEditor({ memoId }: { memoId?: string }) {
  const router = useRouter();

  // Latest values held in refs so the debounced save never reads stale state.
  const idRef = useRef<string | undefined>(memoId);
  const titleRef = useRef("");
  const folderRef = useRef("");
  const tagsRef = useRef<string[]>([]);
  const bodyRef = useRef("");
  const modifiedRef = useRef<string | undefined>(undefined);

  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(memoId));
  // Initial editor body, fixed at mount time (EditorPane reads it once). Held in
  // state so the render path never reads bodyRef.current (react-hooks/refs).
  const [initialBody, setInitialBody] = useState("");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async (force = false) => {
    const id = idRef.current;
    const titleText = titleRef.current.trim();
    const body = bodyRef.current;
    if (!id && !titleText && !body.trim()) return; // nothing to save yet
    setStatus("saving");
    setErrorMsg(null);
    const payload = {
      title: titleText || "(제목 없음)",
      body,
      folder: folderRef.current.trim() || undefined,
      tags: tagsRef.current,
    };
    try {
      if (!id) {
        const r = await api.createMemo(payload);
        idRef.current = r.id;
        modifiedRef.current = r.modifiedTime;
        window.history.replaceState(
          null,
          "",
          `/memo/${encodeURIComponent(r.id)}`,
        );
        await clearDraft("new");
      } else {
        const r = await api.updateMemo(id, {
          ...payload,
          baseModifiedTime: force ? undefined : modifiedRef.current,
        });
        modifiedRef.current = r.modifiedTime;
        await clearDraft(id);
      }
      setStatus("saved");
    } catch (e) {
      if (e instanceof ApiError && e.code === "CONFLICT") setStatus("conflict");
      else {
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "저장에 실패했습니다");
      }
    }
  }, []);

  const scheduleSave = useCallback(() => {
    setStatus("idle");
    void saveDraft({
      id: idRef.current ?? "new",
      title: titleRef.current,
      body: bodyRef.current,
      folder: folderRef.current || undefined,
      tags: tagsRef.current,
      savedAt: Date.now(),
      baseModifiedTime: modifiedRef.current,
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void doSave(false), 1200);
  }, [doSave]);

  // Stable callbacks handed to the isolated editor (never change identity).
  const onEditorChange = useCallback(
    (md: string) => {
      bodyRef.current = md;
      scheduleSave();
    },
    [scheduleSave],
  );

  const onImageUpload = useCallback(
    async (blob: Blob | File): Promise<string> => {
      try {
        const name = (blob as File).name || "image.png";
        const { url } = await api.uploadImage(blob, name);
        return url;
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "이미지 업로드 실패");
        throw e;
      }
    },
    [],
  );

  // Load an existing memo.
  useEffect(() => {
    if (!memoId) return;
    let active = true;
    api
      .getMemo(memoId)
      .then((m) => {
        if (!active) return;
        idRef.current = m.id;
        titleRef.current = m.title;
        folderRef.current = m.folder ?? "";
        tagsRef.current = m.tags;
        bodyRef.current = m.body;
        modifiedRef.current = m.modifiedTime;
        setInitialBody(m.body);
        setTitle(m.title);
        setFolder(m.folder ?? "");
        setTagsText(m.tags.join(", "));
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setErrorMsg(e instanceof Error ? e.message : "불러오기 실패");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [memoId]);

  function onTitle(v: string) {
    titleRef.current = v;
    setTitle(v);
    scheduleSave();
  }
  function onFolder(v: string) {
    folderRef.current = v;
    setFolder(v);
    scheduleSave();
  }
  function onTags(v: string) {
    setTagsText(v);
    tagsRef.current = v
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);
    scheduleSave();
  }

  async function onDelete() {
    const id = idRef.current;
    if (!id) {
      router.push("/");
      return;
    }
    if (!window.confirm("이 메모를 삭제할까요?")) return;
    try {
      await api.deleteMemo(id);
      await clearDraft(id);
      router.push("/");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  const statusColor =
    status === "saved"
      ? "text-emerald-600"
      : status === "error" || status === "conflict"
        ? "text-danger"
        : "text-ink-subtle";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/85 px-2 py-2 backdrop-blur">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
          aria-label="목록으로"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <span className={"text-xs font-medium " + statusColor}>
          {STATUS_LABEL[status]}
        </span>
        <button
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
          aria-label="삭제"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </header>

      {status === "conflict" && (
        <div className="flex items-center justify-between gap-2 bg-warn-soft px-4 py-2 text-xs text-warn-ink">
          <span>다른 곳에서 먼저 수정되었습니다.</span>
          <button
            onClick={() => void doSave(true)}
            className="rounded-lg border border-warn-ink/30 px-2.5 py-1 font-medium transition-colors hover:bg-warn-ink/10"
          >
            덮어쓰기
          </button>
        </div>
      )}
      {errorMsg && (
        <div role="alert" className="bg-danger-soft px-4 py-2 text-xs text-danger">
          {errorMsg}
        </div>
      )}

      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="제목"
        aria-label="제목"
        className="bg-transparent px-4 pt-4 pb-2 text-xl font-bold text-ink outline-none placeholder:text-ink-subtle"
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-subtle">
          불러오는 중…
        </div>
      ) : (
        <EditorPane
          initialValue={initialBody}
          onChange={onEditorChange}
          onImageUpload={onImageUpload}
        />
      )}

      <footer className="flex flex-col gap-2 border-t border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-4 w-4 shrink-0 text-ink-subtle" />
          <input
            value={folder}
            onChange={(e) => onFolder(e.target.value)}
            placeholder="폴더 (선택)"
            aria-label="폴더"
            className="w-full bg-transparent text-xs text-ink-muted outline-none placeholder:text-ink-subtle"
          />
        </div>
        <div className="flex items-center gap-2">
          <HashIcon className="h-4 w-4 shrink-0 text-ink-subtle" />
          <input
            value={tagsText}
            onChange={(e) => onTags(e.target.value)}
            placeholder="태그 (쉼표로 구분)"
            aria-label="태그"
            className="w-full bg-transparent text-xs text-ink-muted outline-none placeholder:text-ink-subtle"
          />
        </div>
      </footer>
    </div>
  );
}
