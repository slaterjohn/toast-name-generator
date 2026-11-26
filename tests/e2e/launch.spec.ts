import { expect, test } from "@playwright/test";

test("brings the new Toast name into view after Reveal on a small screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  const input = page.getByLabel("Your name");
  await input.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await input.fill("Sidney");
  await page.getByRole("button", { name: "Reveal my Toast name" }).click();
  await expect(page.getByText("Your Toast name", { exact: true }).first()).toBeInViewport();
  await expect(page.getByTestId("generated-name")).toBeInViewport();
});

test("pressing Reveal twice with the same name explains why nothing changed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill("Sidney");
  const reveal = page.getByRole("button", { name: "Reveal my Toast name" });
  await reveal.click();
  const first = await page.getByTestId("generated-name").innerText();
  await reveal.click();
  await expect(page.getByText("Woah! Hold your horses, sunshine.")).toBeVisible();
  await expect(page.getByTestId("generated-name")).toHaveText(first);
  await page.getByLabel("Your name").fill("Sidney J");
  await expect(page.getByText("Woah! Hold your horses, sunshine.")).toHaveCount(0);
});

test("credits the creator in the footer", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Created by John Slater");
  await expect(footer.getByRole("link", { name: "slaterjohn.com" })).toHaveAttribute(
    "href",
    "https://slaterjohn.com",
  );
});

test("publishes valid FAQ and app structured data", async ({ page }) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? "{}");
  const types = data["@graph"].map((n: { "@type": string }) => n["@type"]);
  expect(types).toEqual(expect.arrayContaining(["WebSite", "WebApplication", "FAQPage", "Person"]));
  const faq = data["@graph"].find((n: { "@type": string }) => n["@type"] === "FAQPage");
  expect(faq.mainEntity).toHaveLength(5);
  for (const q of faq.mainEntity) {
    await expect(page.getByRole("heading", { name: q.name })).toBeVisible();
  }
});

test("has the metadata and files an installable PWA needs", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Toast of London Name Generator/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://toastnames.com");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og-image\.png$/);

  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );
  for (const path of [
    ...manifest.icons.map((i: { src: string }) => i.src),
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/og-image.png",
    "/sw.js",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
  ]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});
