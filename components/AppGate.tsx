"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import SignIn from "./SignIn";
import FolderPicker from "./FolderPicker";

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6 text-sm text-neutral-500">
      {children}
    </div>
  );
}

// Gates the app: signed out -> SignIn; signed in but no target folder -> Picker;
// otherwise render the app.
export default function AppGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/folder")
      .then((r) => r.json())
      .then((d) => active && setFolderId(d.folderId ?? null))
      .catch(() => active && setFolderId(null));
    return () => {
      active = false;
    };
  }, [status]);

  if (status === "loading") return <FullScreen>불러오는 중…</FullScreen>;
  if (status === "unauthenticated") return <SignIn />;
  if (folderId === undefined) return <FullScreen>불러오는 중…</FullScreen>;
  if (!folderId) return <FolderPicker onSelected={(id) => setFolderId(id)} />;
  return <>{children}</>;
}
