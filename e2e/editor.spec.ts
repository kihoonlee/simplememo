import { test, expect } from "@playwright/test";

// The editor lives behind the auth gate; `?debug=1` (dev-only) renders it
// without a Google session so we can guard the WYSIWYG height-collapse
// regression (the editable area once collapsed to ~0px = "can't write").
test.describe("에디터", () => {
  test("위지윅 본문 영역이 펼쳐지고 입력된다", async ({ page }) => {
    await page.goto("/memo/new?debug=1");
    const ww = page.locator(".toastui-editor-ww-container .ProseMirror");
    await expect(ww).toBeVisible({ timeout: 15000 });
    const box = await ww.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(100); // not collapsed
    await ww.click();
    await page.keyboard.type("자동화 본문 입력");
    await expect(ww).toContainText("자동화 본문 입력");
  });

  test("제목 입력이 동작한다", async ({ page }) => {
    await page.goto("/memo/new?debug=1");
    const title = page.getByPlaceholder("제목");
    await expect(title).toBeVisible({ timeout: 15000 });
    await title.fill("자동화 제목");
    await expect(title).toHaveValue("자동화 제목");
  });
});
