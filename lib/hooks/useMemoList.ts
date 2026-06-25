"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { MemoListEntry } from "@/lib/types";

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "불러오기 실패";
}

// Cursor-paginated list (memos + uploaded files): loads the newest 10 first,
// appends 10 at a time via loadMore(), and replaces the whole list via
// refresh() (pull-to-refresh, or after an upload).
export function useMemoList() {
  const [items, setItems] = useState<MemoListEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // initial load only
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const tokenRef = useRef<string | null>(null);
  const busyRef = useRef(false); // guards against overlapping requests

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const { items: first, nextPageToken } = await api.listMemos();
      setItems(first);
      tokenRef.current = nextPageToken;
      setHasMore(Boolean(nextPageToken));
      setError(null);
    } catch (e) {
      setError(msg(e));
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !tokenRef.current) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const { items: more, nextPageToken } = await api.listMemos(
        tokenRef.current,
      );
      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...more.filter((m) => !seen.has(m.id))];
      });
      tokenRef.current = nextPageToken;
      setHasMore(Boolean(nextPageToken));
      setError(null);
    } catch (e) {
      setError(msg(e));
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // Initial load on mount. refresh() only calls setState after an await, so
    // it does not trigger a synchronous cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { items, error, loading, loadingMore, hasMore, refresh, loadMore };
}
