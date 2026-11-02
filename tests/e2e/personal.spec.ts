import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const vectors: [string, string][] = JSON.parse(
  readFileSync(resolve(process.cwd(), "tests/names/personal-vectors.v1.json"), "utf8"),
);

async function reveal(page: Page, input: string) {
  await page.getByLabel("Your name").fill(input);
  await page.getByRole("button", { name: "Reveal my Toast name" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("generated-name")).toHaveCount(1);
});

test("frozen v1 vectors give the same names in this browser", async ({ page }) => {
  for (const [input, expected] of vectors) {
    await reveal(page, input);
    await expect(page.getByTestId("generated-name"), input).toHaveText(expected);
  }
});

test("equivalent spellings map to the same name", async ({ page }) => {
  await reveal(page, "Siobhán O'Neill");
  const first = await page.getByTestId("generated-name").innerText();
  await reveal(page, "  SIOBHÁN   O’NEILL ");
  await expect(page.getByTestId("generated-name")).toHaveText(first);
});

test("a share link opens the same name, and nothing typed is in it", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await reveal(page, "Grace Hopper");
  const name = await page.getByTestId("generated-name").innerText();
  await page.getByRole("button", { name: "Share link" }).click();
  await expect(page.getByRole("status")).toContainText("Link copied");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\?n=[a-z]+\.[a-z-]+$/);
  expect(link.toLowerCase()).not.toContain("grace");
  expect(link.toLowerCase()).not.toContain("hopper");

  const other = await context.newPage();
  await other.goto(link);
  await expect(other.getByTestId("generated-name")).toHaveText(name);
  await expect(other.getByText("A name shared with you", { exact: true })).toBeVisible();
});

test("downloads a PNG name card", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium");
  await reveal(page, "Ada Lovelace");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download card" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("toast-name-sidney-rutherford.png");
  const path = await download.path();
  const bytes = readFileSync(path!);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  expect(bytes.length).toBeGreaterThan(10_000);
});

test("the entered name is never stored, put in a URL or sent", async ({ page, context, browserName }) => {
  if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const secret = "Zebedee Privacytest";
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.url()} ${r.postData() ?? ""}`));

  await reveal(page, secret);
  await page.getByRole("button", { name: "Favourite", exact: true }).click();
  await page.getByRole("button", { name: "Share link" }).click();
  if (browserName === "chromium") {
    await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download card" }).click()]);
  }
  await page.getByRole("button", { name: /Favourites/ }).click();
  await page.reload();
  await expect(page.getByTestId("generated-name")).toHaveCount(1);

  const dump = await page.evaluate(() => {
    const read = (s: Storage) => Object.keys(s).map((k) => `${k}=${s.getItem(k)}`).join("\n");
    return [read(localStorage), read(sessionStorage), document.cookie, location.href, history.length].join("\n");
  });
  const cookies = JSON.stringify(await context.cookies());
  for (const haystack of [dump, cookies, requests.join("\n"), page.url()]) {
    expect(haystack.toLowerCase()).not.toContain("privacytest");
    expect(haystack.toLowerCase()).not.toContain("zebedee");
  }
  // The reload must not have restored the input either.
  await expect(page.getByLabel("Your name")).toHaveValue("");
});
