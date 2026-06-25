"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { GoogleIcon, NoteIcon } from "./icons";

export default function SignIn() {
  const { data } = useSession();
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <NoteIcon className="h-8 w-8" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            SimpleMemo
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            구글 드라이브에{" "}
            <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[0.85em]">
              .md
            </code>
            로 저장되는 모바일 메모
          </p>
        </div>
      </div>

      {data?.error === "RefreshTokenError" && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger"
        >
          인증이 만료되었습니다. 다시 로그인해 주세요.
        </p>
      )}

      <button
        onClick={() => {
          setBusy(true);
          void signIn("google");
        }}
        disabled={busy}
        className="flex min-h-[52px] w-full max-w-xs items-center justify-center gap-3 rounded-xl border border-line-strong bg-surface px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-canvas active:bg-line disabled:opacity-60"
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        구글로 로그인
      </button>

      <p className="max-w-xs text-xs text-ink-subtle">
        처음 실행이라면{" "}
        <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[0.9em]">
          SETUP.md
        </code>
        의 구글 OAuth 설정이 필요합니다.
      </p>
    </div>
  );
}
