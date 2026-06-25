"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70; // px (after resistance) needed to trigger a load
const MAX_PULL = 90; // px cap on the indicator travel

// Pull-up-to-load-more: when the page is scrolled to the very bottom and the
// user drags upward, surfaces a pull distance. Past THRESHOLD on release it
// calls onLoadMore (the mirror of pull-to-refresh at the top). No-op when
// canLoadMore is false.
export function usePullToLoadMore(
  onLoadMore: () => Promise<void> | void,
  canLoadMore: boolean,
) {
  const [pull, setPull] = useState(0);

  const pullRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  const canRef = useRef(canLoadMore);

  // Keep latest callback/flag in refs so the listener effect runs once.
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
    canRef.current = canLoadMore;
  });

  useEffect(() => {
    const setPullBoth = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    const atBottom = () => {
      const doc = document.documentElement;
      return window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    };

    function onStart(e: TouchEvent) {
      startYRef.current =
        !busyRef.current && canRef.current && atBottom()
          ? e.touches[0].clientY
          : null;
    }

    function onMove(e: TouchEvent) {
      if (startYRef.current === null || busyRef.current) return;
      const dy = startYRef.current - e.touches[0].clientY; // upward = positive
      if (dy > 0 && atBottom()) {
        setPullBoth(Math.min(dy * 0.5, MAX_PULL)); // resistance
        if (e.cancelable) e.preventDefault(); // suppress native overscroll
      } else if (dy <= 0 && pullRef.current !== 0) {
        setPullBoth(0);
      }
    }

    async function onEnd() {
      if (startYRef.current === null) return;
      startYRef.current = null;
      const trigger = pullRef.current >= THRESHOLD;
      setPullBoth(0);
      if (trigger) {
        busyRef.current = true;
        try {
          await onLoadMoreRef.current();
        } finally {
          busyRef.current = false;
        }
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return { pull };
}
