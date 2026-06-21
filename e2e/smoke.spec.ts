import { test, expect } from "@playwright/test";

test.describe("SimpleMemo 스모크", () => {
  test("미인증이면 로그인 화면을 보여준다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SimpleMemo/);
    await expect(
      page.getByRole("heading", { name: "SimpleMemo" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "구글로 로그인" }),
    ).toBeVisible();
  });

  test("매니페스트가 standalone PWA로 제공된다", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const m = await res.json();
    expect(m.name).toBe("SimpleMemo");
    expect(m.display).toBe("standalone");
    expect(Array.isArray(m.icons) && m.icons.length).toBeGreaterThan(0);
  });

  test("로그인 버튼이 drive.file 스코프로 구글에 위임한다", async ({
    page,
  }) => {
    await page.goto("/");
    const res = await page.request.get("/api/auth/providers");
    expect(res.status()).toBe(200);
    const providers = await res.json();
    expect(providers.google?.callbackUrl).toContain(
      "/api/auth/callback/google",
    );
  });
});
