import { describe, it, expect } from "vitest";
import {
  serializeMemo,
  parseMemo,
  parseMeta,
  makeExcerpt,
} from "@/lib/markdown/frontmatter";

describe("frontmatter round-trip", () => {
  it("serializes and parses back", () => {
    const md = serializeMemo(
      {
        title: "출시 회고",
        created: "2026-06-21T15:30:00.000Z",
        updated: "2026-06-21T15:42:00.000Z",
        folder: "업무",
        tags: ["회고", "업무"],
      },
      "본문 내용\n둘째 줄",
    );
    expect(md.startsWith("---")).toBe(true);

    const memo = parseMemo("file123", md);
    expect(memo.id).toBe("file123");
    expect(memo.title).toBe("출시 회고");
    expect(memo.created).toBe("2026-06-21T15:30:00.000Z");
    expect(memo.updated).toBe("2026-06-21T15:42:00.000Z");
    expect(memo.folder).toBe("업무");
    expect(memo.tags).toEqual(["회고", "업무"]);
    expect(memo.body).toContain("본문 내용");
    expect(memo.body).toContain("둘째 줄");
  });

  it("applies fallbacks when frontmatter is missing", () => {
    const memo = parseMemo("x", "그냥 본문");
    expect(memo.title).toBe("(제목 없음)");
    expect(memo.tags).toEqual([]);
    expect(memo.body).toBe("그냥 본문");
  });

  it("omits folder when not set", () => {
    const md = serializeMemo(
      {
        title: "t",
        created: "2026-06-21T00:00:00.000Z",
        updated: "2026-06-21T00:00:00.000Z",
        tags: [],
      },
      "b",
    );
    expect(md).not.toContain("folder:");
  });

  it("parseMeta carries name + modifiedTime + excerpt without body", () => {
    const md = serializeMemo(
      {
        title: "메타 테스트",
        created: "2026-06-21T00:00:00.000Z",
        updated: "2026-06-21T00:00:00.000Z",
        tags: ["a"],
      },
      "body here",
    );
    const meta = parseMeta("id9", "meta-test.md", md, "2026-06-21T01:02:03.000Z");
    expect(meta.name).toBe("meta-test.md");
    expect(meta.title).toBe("메타 테스트");
    expect(meta.modifiedTime).toBe("2026-06-21T01:02:03.000Z");
    expect(meta.excerpt).toBe("body here");
    expect((meta as unknown as { body?: string }).body).toBeUndefined();
  });
});

describe("parseMeta fallbacks for non-SimpleMemo files", () => {
  it("falls back to the filename when there is no title", () => {
    const meta = parseMeta(
      "id1",
      "Working Memory.md",
      "프론트매터 없는 본문",
      "2026-06-20T08:00:00.000Z",
    );
    expect(meta.title).toBe("Working Memory");
  });

  it("uses Drive modifiedTime when frontmatter has no date (no 1970)", () => {
    const meta = parseMeta(
      "id2",
      "x.md",
      "본문만",
      "2026-06-20T08:00:00.000Z",
    );
    expect(meta.updated).toBe("2026-06-20T08:00:00.000Z");
    expect(meta.created).toBe("2026-06-20T08:00:00.000Z");
    expect(new Date(meta.updated).getFullYear()).toBe(2026);
  });

  it("keeps real frontmatter title/date over fallbacks", () => {
    const md = serializeMemo(
      {
        title: "진짜 제목",
        created: "2026-05-01T00:00:00.000Z",
        updated: "2026-05-02T00:00:00.000Z",
        tags: [],
      },
      "본문",
    );
    const meta = parseMeta("id3", "slug.md", md, "2026-06-20T08:00:00.000Z");
    expect(meta.title).toBe("진짜 제목");
    expect(meta.updated).toBe("2026-05-02T00:00:00.000Z");
  });
});

describe("makeExcerpt", () => {
  it("strips markdown syntax for a clean preview", () => {
    const ex = makeExcerpt(
      "## 회의록\n\n- [링크](http://example.com) 내용\n```js\ncode()\n```",
    );
    expect(ex).toContain("회의록");
    expect(ex).toContain("링크");
    expect(ex).toContain("내용");
    expect(ex).not.toContain("#");
    expect(ex).not.toContain("```");
    expect(ex).not.toContain("http");
    expect(ex).not.toContain("code()");
  });

  it("truncates long bodies with an ellipsis", () => {
    const ex = makeExcerpt("가".repeat(200));
    expect(ex.endsWith("…")).toBe(true);
    expect(ex.length).toBeLessThanOrEqual(101);
  });

  it("returns empty string for an empty body", () => {
    expect(makeExcerpt("")).toBe("");
  });
});
