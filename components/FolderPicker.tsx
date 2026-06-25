"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { FolderIcon } from "./icons";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: { load: (mod: string, cb: () => void) => void };
    google?: any;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
const SCOPE = "https://www.googleapis.com/auth/drive.file";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
    document.head.appendChild(s);
  });
}

export default function FolderPicker({
  onSelected,
}: {
  onSelected: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(CLIENT_ID && API_KEY && APP_ID);

  async function openPicker() {
    setError(null);
    setBusy(true);
    try {
      await Promise.all([
        loadScript("https://apis.google.com/js/api.js"),
        loadScript("https://accounts.google.com/gsi/client"),
      ]);
      await new Promise<void>((res) => window.gapi!.load("picker", () => res()));

      const token = await new Promise<string>((resolve, reject) => {
        const tc = window.google!.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          callback: (r: any) =>
            r?.access_token
              ? resolve(r.access_token)
              : reject(new Error("토큰 발급에 실패했습니다")),
        });
        tc.requestAccessToken({ prompt: "" });
      });

      const google = window.google!;
      const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
        .setSelectFolderEnabled(true)
        .setMimeTypes("application/vnd.google-apps.folder");

      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY!)
        .setAppId(APP_ID!)
        .setTitle("메모를 저장할 폴더 선택")
        .setCallback(async (data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const doc = data.docs?.[0];
            if (doc?.id) {
              try {
                await api.setFolder(doc.id, doc.name);
                onSelected(doc.id);
              } catch (e) {
                setError(e instanceof Error ? e.message : "폴더 저장 실패");
                setBusy(false);
              }
            }
          } else if (data.action === google.picker.Action.CANCEL) {
            setBusy(false);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Picker 로드 실패");
      setBusy(false);
    }
  }

  async function createAppFolder() {
    setError(null);
    setBusy(true);
    try {
      const { folderId } = await api.createAppFolder();
      onSelected(folderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "폴더 생성 실패");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <FolderIcon className="h-8 w-8" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            메모를 저장할 폴더 선택
          </h1>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">
            새 메모는 선택한 구글 드라이브 폴더에{" "}
            <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[0.85em]">
              .md
            </code>
            로 저장됩니다.
          </p>
        </div>
      </div>

      {configured ? (
        <button
          onClick={openPicker}
          disabled={busy}
          className="flex min-h-[52px] w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          <FolderIcon className="h-5 w-5 shrink-0" />
          {busy ? "여는 중…" : "드라이브에서 폴더 선택"}
        </button>
      ) : (
        <p className="max-w-xs rounded-lg bg-warn-soft px-4 py-3 text-xs text-warn-ink">
          Picker 설정값(
          <code className="font-mono">NEXT_PUBLIC_GOOGLE_*</code>)이 없습니다.
          아래로 앱 전용 폴더를 만들거나{" "}
          <code className="font-mono">SETUP.md</code>를 완료하세요.
        </p>
      )}

      <button
        onClick={createAppFolder}
        disabled={busy}
        className="min-h-[44px] text-sm font-medium text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50"
      >
        앱 전용 ‘SimpleMemo’ 폴더 새로 만들기
      </button>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
