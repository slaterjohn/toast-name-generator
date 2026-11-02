import { expect, test } from "@playwright/test";

const nameLocator = (page: import("@playwright/test").Page) => page.getByTestId("generated-name");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(nameLocator(page)).toHaveCount(1);
});

test("shows one name and replaces it on Regenerate without scrolling", async ({ page }) => {
  const first = await nameLocator(page).innerText();
  await page.evaluate(() => window.scrollTo(0, 40));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Regenerate" }).click();
  await expect(nameLocator(page)).not.toHaveText(first);
  await expect(nameLocator(page)).toHaveCount(1);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});

test("is keyboard operable", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium");
  const first = await nameLocator(page).innerText();
  const regenerate = page.getByRole("button", { name: "Regenerate" });
  // Tab from the top of the page until Regenerate has focus.
  for (let i = 0; i < 10 && !(await regenerate.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(regenerate).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(nameLocator(page)).not.toHaveText(first);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Copy name" })).toBeFocused();
  await page.keyboard.press("Tab");
  const fav = page.getByRole("button", { name: "Favourite", exact: true });
  await expect(fav).toBeFocused();
  await page.keyboard.press("Space");
  await expect(fav).toHaveAttribute("aria-pressed", "true");
});

test("copies the visible name", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const name = await nameLocator(page).innerText();
  await page.getByRole("button", { name: "Copy name" }).click();
  await expect(page.getByRole("status")).toContainText(`Copied ${name}`);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(name);
});

test("favourites survive a reload", async ({ page }) => {
  const name = await nameLocator(page).innerText();
  await page.getByRole("button", { name: "Favourite", exact: true }).click();
  await page.reload();
  await expect(nameLocator(page)).toHaveCount(1);
  await page.getByRole("button", { name: /Favourites \(1\)/ }).click();
  await expect(page.getByRole("list", { name: "Saved names" })).toContainText(name);
});

test("does not repeat names across a reload in the same tab", async ({ page }) => {
  const seen = new Set<string>();
  for (let i = 0; i < 15; i++) {
    seen.add(await nameLocator(page).innerText());
    await page.waitForTimeout(160);
    await page.getByRole("button", { name: "Regenerate" }).click();
  }
  await page.reload();
  const after = await nameLocator(page).innerText();
  expect(seen.has(after)).toBe(false);
});

test("never scrolls horizontally on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (let i = 0; i < 40; i++) {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, await nameLocator(page).innerText()).toBe(false);
    await page.waitForTimeout(155);
    await page.getByRole("button", { name: "Regenerate" }).click();
  }
});

test("disables the name animation when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Regenerate" }).click();
  const duration = await nameLocator(page).evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.001);
});

test("makes no requests to other origins", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).origin !== new URL(page.url()).origin) external.push(r.url());
  });
  await page.reload();
  await expect(nameLocator(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Regenerate" }).click();
  await page.getByRole("button", { name: /Favourites/ }).click();
  await page.waitForLoadState("networkidle");
  expect(external).toEqual([]);
});

test("shows the disclaimer", async ({ page }) => {
  await expect(page.getByText("An unofficial fan-inspired name generator.")).toBeVisible();
});

test("has no detectable WCAG 2.2 AA violations", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.getByRole("button", { name: /Favourites/ }).click();
  await page.getByRole("button", { name: "Favourite", exact: true }).click();
  await expect(page.getByRole("list", { name: "Saved names" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
