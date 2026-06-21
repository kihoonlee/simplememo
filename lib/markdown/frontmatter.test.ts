import { describe, it, expect } from "vitest";
import { serializeMemo, parseMemo, parseMeta } from "@/lib/markdown/frontmatter";

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

  it("parseMeta carries name + modifiedTime without body", () => {
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
    expect((meta as unknown as { body?: string }).body).toBeUndefined();
  });
});
