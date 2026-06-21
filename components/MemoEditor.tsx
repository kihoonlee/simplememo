"use client";

import "@toast-ui/editor/dist/toastui-editor.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type ToastEditor from "@toast-ui/editor";
import { api, ApiError } from "@/lib/api-client";
import { saveDraft, clearDraft } from "@/lib/store/db";

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

  const elRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<ToastEditor | null>(null);
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

  const addImageBlobHook = useCallback(
    async (blob: Blob | File, cb: (url: string, alt?: string) => void) => {
      try {
        const name = (blob as File).name || "image.png";
        const { url } = await api.uploadImage(blob, name);
        cb(url, name);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "이미지 업로드 실패");
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

  // Initialise the Toast UI editor (browser only) once content is ready.
  useEffect(() => {
    if (loading) return;
    let editor: ToastEditor | null = null;
    let disposed = false;
    (async () => {
      const EditorCls = (await import("@toast-ui/editor")).default;
      if (disposed || !elRef.current) return;
      editor = new EditorCls({
        el: elRef.current,
        initialEditType: "wysiwyg",
        previewStyle: "tab",
        height: "100%",
        initialValue: bodyRef.current,
        autofocus: false,
        hooks: { addImageBlobHook },
      });
      editor.on("change", () => {
        bodyRef.current = editor!.getMarkdown();
        scheduleSave();
      });
      editorRef.current = editor;
    })();
    return () => {
      disposed = true;
      try {
        editor?.destroy();
      } catch {
        // ignore teardown errors
      }
      editorRef.current = null;
    };
  }, [loading, addImageBlobHook, scheduleSave]);

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
      ? "text-green-600"
      : status === "error" || status === "conflict"
        ? "text-red-600"
        : "text-neutral-400";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-2">
        <Link
          href="/"
          className="px-2 py-1 text-neutral-500 hover:text-neutral-800"
          aria-label="목록으로"
        >
          ←
        </Link>
        <span className={"text-xs " + statusColor}>{STATUS_LABEL[status]}</span>
        <button
          onClick={onDelete}
          className="px-2 py-1 text-neutral-500 hover:text-red-600"
          aria-label="삭제"
        >
          삭제
        </button>
      </header>

      {status === "conflict" && (
        <div className="flex items-center justify-between gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <span>다른 곳에서 먼저 수정되었습니다.</span>
          <button
            onClick={() => void doSave(true)}
            className="rounded border border-amber-300 px-2 py-1 hover:bg-amber-100"
          >
            덮어쓰기
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 px-4 py-2 text-xs text-red-700">{errorMsg}</div>
      )}

      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="제목"
        className="px-4 pt-3 pb-1 text-lg font-medium outline-none"
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
          불러오는 중…
        </div>
      ) : (
        // Give Toast UI a definite-height containing block: an absolutely
        // positioned inner div fills the flex slot so `height: 100%` resolves.
        <div className="relative min-h-0 flex-1">
          <div ref={elRef} className="absolute inset-0" />
        </div>
      )}

      <footer className="flex flex-col gap-1 border-t border-neutral-200 px-4 py-2">
        <input
          value={folder}
          onChange={(e) => onFolder(e.target.value)}
          placeholder="폴더 (선택)"
          className="text-xs text-neutral-600 outline-none placeholder:text-neutral-400"
        />
        <input
          value={tagsText}
          onChange={(e) => onTags(e.target.value)}
          placeholder="태그 (쉼표로 구분)"
          className="text-xs text-neutral-600 outline-none placeholder:text-neutral-400"
        />
      </footer>
    </div>
  );
}
