"use client";

import { signIn, useSession } from "next-auth/react";

export default function SignIn() {
  const { data } = useSession();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-2xl font-medium">SimpleMemo</h1>
        <p className="mt-2 text-sm text-neutral-500">
          구글 드라이브에 <code>.md</code>로 저장되는 모바일 메모
        </p>
      </div>
      {data?.error === "RefreshTokenError" && (
        <p className="text-sm text-red-600">
          인증이 만료되었습니다. 다시 로그인해 주세요.
        </p>
      )}
      <button
        onClick={() => signIn("google")}
        className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:bg-neutral-50 active:scale-[0.98]"
      >
        구글로 로그인
      </button>
      <p className="max-w-xs text-xs text-neutral-400">
        처음 실행이라면 <code>SETUP.md</code>의 구글 OAuth 설정이 필요합니다.
      </p>
    </div>
  );
}
