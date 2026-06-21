import { describe, it, expect } from "vitest";
import { slugify, memoFilename, uniqueFilename } from "@/lib/markdown/slug";

describe("slugify", () => {
  it("lowercases and dashes ascii", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("keeps Korean letters", () => {
    expect(slugify("출시 회고 메모")).toBe("출시-회고-메모");
  });
  it("trims separators and collapses symbols", () => {
    expect(slugify("  !!hi, there!!  ")).toBe("hi-there");
  });
  it("falls back to 'memo' when empty", () => {
    expect(slugify("!!!")).toBe("memo");
    expect(slugify("")).toBe("memo");
  });
});

describe("uniqueFilename", () => {
  it("returns slug.md when free", () => {
    expect(uniqueFilename("note", new Set())).toBe("note.md");
  });
  it("suffixes on collision", () => {
    expect(uniqueFilename("note", new Set(["note.md"]))).toBe("note-2.md");
    expect(uniqueFilename("note", new Set(["note.md", "note-2.md"]))).toBe(
      "note-3.md",
    );
  });
  it("memoFilename appends .md", () => {
    expect(memoFilename("abc")).toBe("abc.md");
  });
});
