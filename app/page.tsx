"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { api } from "@/lib/api-client";
import type { MemoMeta } from "@/lib/types";
import {
  PlusIcon,
  SearchIcon,
  FolderIcon,
  HashIcon,
  ExternalLinkIcon,
  LogOutIcon,
  NoteIcon,
} from "@/components/icons";

type Filter = { type: "all" | "folder" | "tag"; value?: string };

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function shortDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ko-KR");
}

export default function HomePage() {
  const [memos, setMemos] = useState<MemoMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>({ type: "all" });
  const [folderInfo, setFolderInfo] = useState<{
    folderName?: string;
    folderLink?: string | null;
  } | null>(null);

  useEffect(() => {
    api
      .listMemos()
      .then(setMemos)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"));
  }, []);

  useEffect(() => {
    api
      .getFolder()
      .then(setFolderInfo)
      .catch(() => {});
  }, []);

  const folders = useMemo(
    () => uniq((memos ?? []).flatMap((m) => (m.folder ? [m.folder] : []))),
    [memos],
  );
  const tags = useMemo(() => uniq((memos ?? []).flatMap((m) => m.tags)), [memos]);

  const filtered = useMemo(() => {
    let list = memos ?? [];
    if (filter.type === "folder")
      list = list.filter((m) => m.folder === filter.value);
    if (filter.type === "tag")
      list = list.filter((m) => m.tags.includes(filter.value!));
    const needle = q.trim().toLowerCase();
    if (needle)
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(needle) ||
          m.tags.some((t) => t.toLowerCase().includes(needle)) ||
          (m.folder?.toLowerCase().includes(needle) ?? false),
      );
    return list;
  }, [memos, filter, q]);

  const isActive = (f: Filter) =>
    f.type === filter.type && f.value === filter.value;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold tracking-tight text-ink">메모</h1>
        <button
          onClick={() => void signOut()}
          className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-line hover:text-ink"
        >
          <LogOutIcon className="h-4 w-4" />
          로그아웃
        </button>
      </header>

      {folderInfo?.folderName && (
        <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-ink-subtle">
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
            placeholder="제목·태그 검색"
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
        {!error && memos === null && (
          <p className="py-16 text-center text-sm text-ink-subtle">
            불러오는 중…
          </p>
        )}
        {!error && memos !== null && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-line text-ink-subtle">
              <NoteIcon className="h-7 w-7" />
            </span>
            <p className="text-sm text-ink-muted">
              {q || filter.type !== "all"
                ? "조건에 맞는 메모가 없습니다."
                : "아직 메모가 없습니다."}
              <br />
              오른쪽 아래 + 버튼으로 새로 작성하세요.
            </p>
          </div>
        )}
        <ul className="flex flex-col gap-2.5">
          {filtered.map((m) => (
            <li key={m.id}>
              <Link
                href={`/memo/${encodeURIComponent(m.id)}`}
                className="block rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-sm transition-colors hover:border-line-strong"
              >
                <div className="truncate text-[15px] font-semibold text-ink">
                  {m.title}
                </div>
                {m.excerpt && (
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {m.excerpt}
                  </p>
                )}
                <div className="mt-1 text-xs text-ink-subtle">
                  {shortDate(m.updated)}
                </div>
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
            </li>
          ))}
        </ul>
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
