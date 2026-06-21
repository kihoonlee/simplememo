"use client";

import "@toast-ui/editor/dist/toastui-editor.css";
import { memo, useEffect, useRef } from "react";
import type ToastEditor from "@toast-ui/editor";

interface Props {
  initialValue: string;
  onChange: (markdown: string) => void;
  onImageUpload: (blob: Blob | File) => Promise<string>;
}

// The Toast UI editor manages its own DOM imperatively. We isolate it in a
// memoized component that mounts once and never re-renders, so React never
// reconciles the editor subtree while Toast UI owns it (prevents
// "removeChild: node not a child" DOM-desync errors on parent state changes).
// Callbacks are read through refs so they stay current without remounting.
function EditorPaneImpl({ initialValue, onChange, onImageUpload }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onImageRef = useRef(onImageUpload);
  onImageRef.current = onImageUpload;
  const initialRef = useRef(initialValue);

  useEffect(() => {
    let editor: ToastEditor | null = null;
    let disposed = false;
    (async () => {
      const EditorCls = (await import("@toast-ui/editor")).default;
      if (disposed || !elRef.current) return;
      editor = new EditorCls({
        el: elRef.current,
        initialEditType: "wysiwyg",
        previewStyle: "tab",
        height: "100%",
        initialValue: initialRef.current,
        autofocus: false,
        hooks: {
          addImageBlobHook: (blob: Blob | File, cb: (url: string, alt?: string) => void) => {
            onImageRef.current(blob)
              .then((url) => cb(url, ""))
              .catch(() => {});
          },
        },
      });
      editor.on("change", () => onChangeRef.current(editor!.getMarkdown()));
    })();
    return () => {
      disposed = true;
      try {
        editor?.destroy();
      } catch {
        // ignore teardown races
      }
    };
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={elRef} className="absolute inset-0" />
    </div>
  );
}

// Never re-render once mounted: props are stable (string + useCallback fns).
export default memo(EditorPaneImpl, () => true);
