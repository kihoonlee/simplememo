"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { api } from "@/lib/api-client";
import type { MemoMeta } from "@/lib/types";

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

  useEffect(() => {
    api
      .listMemos()
      .then(setMemos)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"));
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
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-neutral-50/90 px-4 py-3 backdrop-blur">
        <span className="text-lg font-medium">메모</span>
        <button
          onClick={() => signOut()}
          className="text-xs text-neutral-400 hover:text-neutral-700"
        >
          로그아웃
        </button>
      </header>

      <div className="px-4 pt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목·태그 검색"
          className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-300"
        />
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3">
        <Chip active={isActive({ type: "all" })} onClick={() => setFilter({ type: "all" })}>
          전체
        </Chip>
        {folders.map((f) => (
          <Chip
            key={`f-${f}`}
            active={isActive({ type: "folder", value: f })}
            onClick={() => setFilter({ type: "folder", value: f })}
          >
            📁 {f}
          </Chip>
        ))}
        {tags.map((t) => (
          <Chip
            key={`t-${t}`}
            active={isActive({ type: "tag", value: t })}
            onClick={() => setFilter({ type: "tag", value: t })}
          >
            #{t}
          </Chip>
        ))}
      </div>

      <main className="flex-1 px-4 pb-28">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {!error && memos === null && (
          <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
        )}
        {!error && memos !== null && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            메모가 없습니다. 아래 + 버튼으로 새로 작성하세요.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {filtered.map((m) => (
            <li key={m.id}>
              <Link
                href={`/memo/${encodeURIComponent(m.id)}`}
                className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-300"
              >
                <div className="truncate text-sm font-medium">{m.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                  <span className="truncate">{m.name}</span>
                  <span>·</span>
                  <span>{shortDate(m.updated)}</span>
                </div>
                {(m.tags.length > 0 || m.folder) && (
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-neutral-500">
                    {m.folder && <span>📁 {m.folder}</span>}
                    {m.tags.map((t) => (
                      <span key={t}>#{t}</span>
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
        className="fixed bottom-6 right-[max(1.5rem,calc(50vw-13rem))] flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-3xl leading-none text-white shadow-lg active:scale-95"
      >
        +
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
        "rounded-full px-3 py-1 text-xs transition " +
        (active
          ? "bg-neutral-900 text-white"
          : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100")
      }
    >
      {children}
    </button>
  );
}
