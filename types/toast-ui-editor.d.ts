// @toast-ui/editor ships types at ./types but its package.json "exports" does
// not expose them under bundler module resolution. Declare the minimal surface
// we use so the editor stays typed without fighting the package's exports map.
declare module "@toast-ui/editor" {
  export interface EditorEventMap {
    change: () => void;
    [event: string]: (...args: unknown[]) => void;
  }

  export default class Editor {
    constructor(options: Record<string, unknown>);
    getMarkdown(): string;
    setMarkdown(markdown: string, cursorToEnd?: boolean): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string): void;
    focus(): void;
    destroy(): void;
  }
}
