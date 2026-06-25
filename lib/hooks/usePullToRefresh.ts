"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70; // px (after resistance) needed to trigger a refresh
const MAX_PULL = 90; // px cap on the indicator travel

// Pull-to-refresh for the document: when the page is scrolled to the very top
// and the user drags down, surfaces a pull distance + refreshing flag. The
// caller renders the indicator and runs onRefresh when released past THRESHOLD.
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const pullRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep the latest callback in a ref so the listener effect runs once.
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    const setPullBoth = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    function onStart(e: TouchEvent) {
      startYRef.current =
        !refreshingRef.current && window.scrollY <= 0
          ? e.touches[0].clientY
          : null;
    }

    function onMove(e: TouchEvent) {
      if (startYRef.current === null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0 && window.scrollY <= 0) {
        setPullBoth(Math.min(dy * 0.5, MAX_PULL)); // resistance
        if (e.cancelable) e.preventDefault(); // suppress native overscroll
      } else if (dy <= 0 && pullRef.current !== 0) {
        setPullBoth(0);
      }
    }

    async function onEnd() {
      if (startYRef.current === null) return;
      startYRef.current = null;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullBoth(THRESHOLD);
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullBoth(0);
        }
      } else {
        setPullBoth(0);
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

  return { pull, refreshing };
}
