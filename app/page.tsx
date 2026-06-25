"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { api } from "@/lib/api-client";
import { useMemoList } from "@/lib/hooks/useMemoList";
import { usePullToRefresh } from "@/lib/hooks/usePullToRefresh";
import type { FileItem, MemoMeta } from "@/lib/types";
import {
  PlusIcon,
  SearchIcon,
  FolderIcon,
  HashIcon,
  ExternalLinkIcon,
  LogOutIcon,
  UploadIcon,
  FileIcon,
  NoteIcon,
  SpinnerIcon,
} from "@/components/icons";

type Filter = { type: "all" | "folder" | "tag"; value?: string };
type MemoEntry = MemoMeta & { kind: "memo" };

const PULL_THRESHOLD = 70; // keep in sync with usePullToRefresh

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function shortDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ko-KR");
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function HomePage() {
  const { items, error, loading, loadingMore, hasMore, refresh, loadMore } =
    useMemoList();
  const { pull, refreshing } = usePullToRefresh(refresh);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>({ type: "all" });
  const [folderInfo, setFolderInfo] = useState<{
    folderName?: string;
    folderLink?: string | null;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getFolder()
      .then(setFolderInfo)
      .catch(() => {});
  }, []);

  const memos = useMemo(
    () => items.filter((it): it is MemoEntry => it.kind === "memo"),
    [items],
  );
  const folders = useMemo(
    () => uniq(memos.flatMap((m) => (m.folder ? [m.folder] : []))),
    [memos],
  );
  const tags = useMemo(() => uniq(memos.flatMap((m) => m.tags)), [memos]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter.type === "folder")
      list = list.filter((it) => it.kind === "memo" && it.folder === filter.value);
    if (filter.type === "tag")
      list = list.filter(
        (it) => it.kind === "memo" && it.tags.includes(filter.value!),
      );
    const needle = q.trim().toLowerCase();
    if (needle)
      list = list.filter((it) => {
        if (it.kind === "file") return it.name.toLowerCase().includes(needle);
        return (
          it.title.toLowerCase().includes(needle) ||
          (it.excerpt?.toLowerCase().includes(needle) ?? false) ||
          it.tags.some((t) => t.toLowerCase().includes(needle)) ||
          (it.folder?.toLowerCase().includes(needle) ?? false)
        );
      });
    return list;
  }, [items, filter, q]);

  const isActive = (f: Filter) =>
    f.type === filter.type && f.value === filter.value;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadFile(file);
      await refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }
  }

  // Infinite scroll: load the next page when the sentinel nears the viewport.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { rootMargin: "240px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  const pullProgress = Math.min(pull / PULL_THRESHOLD, 1);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold tracking-tight text-ink">메모</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-line hover:text-ink disabled:opacity-60"
          >
            {uploading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <UploadIcon className="h-4 w-4" />
            )}
            업로드
          </button>
          <button
            onClick={() => void signOut()}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-line hover:text-ink"
          >
            <LogOutIcon className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onPickFile}
      />

      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden text-ink-subtle transition-[height] duration-200"
        style={{ height: refreshing ? 44 : pull }}
        aria-hidden={!refreshing}
      >
        <SpinnerIcon
          className={"h-5 w-5 " + (refreshing ? "animate-spin" : "")}
          style={
            refreshing
              ? undefined
              : {
                  opacity: pullProgress,
                  transform: `rotate(${pullProgress * 270}deg)`,
                }
          }
        />
      </div>

      {uploadError && (
        <p
          role="alert"
          className="mx-4 mt-1 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {uploadError}
        </p>
      )}

      {folderInfo?.folderName && (
        <div className="flex items-center gap-1.5 px-4 pt-2 text-xs text-ink-subtle">
          <FolderIcon className="h-3.5 w-3.5 shrink-0" />
          <span>저장 위치</span>
          {folderInfo.folderLink ? (
            <a
              href={folderInfo.folderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-ink-muted underline underline-offset-2 transition-colors hover:text-brand"
            >
              {folderInfo.folderName}
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
          ) : (
            <span className="font-medium text-ink-muted">
              {folderInfo.folderName}
            </span>
          )}
        </div>
      )}

      <div className="px-4 pt-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <label htmlFor="memo-search" className="sr-only">
            메모 검색
          </label>
          <input
            id="memo-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목·내용·파일명 검색"
            className="w-full rounded-xl border border-transparent bg-surface py-2.5 pl-9 pr-3 text-sm text-ink shadow-sm outline-none placeholder:text-ink-subtle focus:border-brand"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3">
        <Chip
          active={isActive({ type: "all" })}
          onClick={() => setFilter({ type: "all" })}
        >
          전체
        </Chip>
        {folders.map((f) => (
          <Chip
            key={`f-${f}`}
            active={isActive({ type: "folder", value: f })}
            onClick={() => setFilter({ type: "folder", value: f })}
          >
            <FolderIcon className="h-3.5 w-3.5" />
            {f}
          </Chip>
        ))}
        {tags.map((t) => (
          <Chip
            key={`t-${t}`}
            active={isActive({ type: "tag", value: t })}
            onClick={() => setFilter({ type: "tag", value: t })}
          >
            <HashIcon className="h-3.5 w-3.5" />
            {t}
          </Chip>
        ))}
      </div>

      <main className="flex-1 px-4 pb-28">
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        {!error && loading && (
          <p className="py-16 text-center text-sm text-ink-subtle">
            불러오는 중…
          </p>
        )}
        {!error && !loading && filtered.length === 0 && !hasMore && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-line text-ink-subtle">
              <NoteIcon className="h-7 w-7" />
            </span>
            <p className="text-sm text-ink-muted">
              {q || filter.type !== "all"
                ? "조건에 맞는 항목이 없습니다."
                : "아직 메모가 없습니다."}
              <br />
              오른쪽 아래 + 버튼으로 새로 작성하세요.
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-2.5">
          {filtered.map((it) =>
            it.kind === "memo" ? (
              <li key={it.id}>
                <MemoCard m={it} />
              </li>
            ) : (
              <li key={it.id}>
                <FileCard f={it} />
              </li>
            ),
          )}
        </ul>

        {/* Infinite-scroll sentinel + loading row */}
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
        {loadingMore && (
          <div className="flex justify-center py-5">
            <SpinnerIcon className="h-5 w-5 animate-spin text-ink-subtle" />
          </div>
        )}
      </main>

      <Link
        href="/memo/new"
        aria-label="새 메모"
        className="fixed bottom-6 right-[max(1.5rem,calc(50vw-13rem))] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-lg shadow-brand/30 transition-colors hover:bg-brand-hover"
      >
        <PlusIcon className="h-7 w-7" />
      </Link>
    </div>
  );
}

function MemoCard({ m }: { m: MemoMeta }) {
  return (
    <Link
      href={`/memo/${encodeURIComponent(m.id)}`}
      className="block rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-sm transition-colors hover:border-line-strong"
    >
      <div className="truncate text-[15px] font-semibold text-ink">
        {m.title}
      </div>
      {m.excerpt && (
        <p className="mt-0.5 truncate text-xs text-ink-muted">{m.excerpt}</p>
      )}
      <div className="mt-1 text-xs text-ink-subtle">{shortDate(m.updated)}</div>
      {(m.tags.length > 0 || m.folder) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {m.folder && (
            <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
              <FolderIcon className="h-3 w-3" />
              {m.folder}
            </span>
          )}
          {m.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-0.5 rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand"
            >
              <HashIcon className="h-3 w-3" />
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function FileCard({ f }: { f: FileItem }) {
  const meta = [formatSize(f.size), shortDate(f.modifiedTime)]
    .filter(Boolean)
    .join(" · ");
  return (
    <a
      href={f.webViewLink ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-sm transition-colors hover:border-line-strong"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-muted">
        <FileIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">
          {f.name}
        </span>
        {meta && (
          <span className="mt-0.5 block text-xs text-ink-subtle">{meta}</span>
        )}
      </span>
      <ExternalLinkIcon className="h-4 w-4 shrink-0 text-ink-subtle" />
    </a>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors " +
        (active
          ? "bg-brand text-on-brand"
          : "border border-line-strong bg-surface text-ink-muted hover:bg-canvas hover:text-ink")
      }
    >
      {children}
    </button>
  );
}
