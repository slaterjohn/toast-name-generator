// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NameGenerator } from "@/components/name-generator";
import { FAVOURITES_KEY } from "@/lib/storage/favourites";
import { SESSION_KEY } from "@/lib/storage/session-store";

function setClipboard(writeText: (t: string) => Promise<void>, secure = true) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  Object.defineProperty(window, "isSecureContext", { value: secure, configurable: true });
}

async function currentName() {
  return (await screen.findByTestId("generated-name")).textContent ?? "";
}

/** Wait past the double-press guard so the next click counts. */
async function regenerate(user: ReturnType<typeof userEvent.setup>) {
  await act(() => new Promise((r) => setTimeout(r, 160)));
  await user.click(screen.getByRole("button", { name: "Regenerate" }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.execCommand = vi.fn(() => false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("NameGenerator", () => {
  it("shows exactly one generated name on load", async () => {
    render(<NameGenerator />);
    const name = await currentName();
    expect(name).toMatch(/^\S+ \S+$/);
    expect(screen.getAllByTestId("generated-name")).toHaveLength(1);
  });

  it("generates once under Strict Mode", async () => {
    render(
      <StrictMode>
        <NameGenerator />
      </StrictMode>,
    );
    await currentName();
    const snapshot = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}");
    expect(snapshot.emitted).toHaveLength(1);
  });

  it("replaces the name on Regenerate and announces it politely", async () => {
    const user = userEvent.setup();
    render(<NameGenerator />);
    const first = await currentName();
    await regenerate(user);
    const second = await currentName();
    expect(second).not.toBe(first);
    expect(screen.getAllByTestId("generated-name")).toHaveLength(1);
    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe(second);
  });

  it("ignores an accidental double press", async () => {
    const user = userEvent.setup();
    render(<NameGenerator />);
    await currentName();
    await regenerate(user);
    await user.click(screen.getByRole("button", { name: "Regenerate" }));
    const snapshot = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}");
    expect(snapshot.emitted).toHaveLength(2);
  });

  it("copies the visible name and reports success", async () => {
    const user = userEvent.setup(); // installs its own clipboard stub, so override after
    const writeText = vi.fn(() => Promise.resolve());
    setClipboard(writeText);
    render(<NameGenerator />);
    const name = await currentName();
    await user.click(screen.getByRole("button", { name: "Copy name" }));
    expect(writeText).toHaveBeenCalledWith(name);
    expect(await screen.findByRole("status")).toHaveTextContent(`Copied ${name} to the clipboard.`);
  });

  it("reports a copy failure clearly", async () => {
    const user = userEvent.setup();
    setClipboard(() => Promise.reject(new Error("denied")));
    render(<NameGenerator />);
    await currentName();
    await user.click(screen.getByRole("button", { name: "Copy name" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Couldn't copy automatically");
  });

  it("falls back to execCommand outside a secure context", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    setClipboard(writeText, false);
    document.execCommand = vi.fn(() => true);
    render(<NameGenerator />);
    await currentName();
    await user.click(screen.getByRole("button", { name: "Copy name" }));
    expect(writeText).not.toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(await screen.findByRole("status")).toHaveTextContent("Copied");
  });

  it("saves and removes a favourite with an accessible toggle state", async () => {
    const user = userEvent.setup();
    render(<NameGenerator />);
    const name = await currentName();
    const toggle = screen.getByRole("button", { name: "Favourite" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? "[]")[0].display).toBe(name);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? "[]")).toEqual([]);
  });

  it("keeps favourites across a reload and lists them in the panel", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<NameGenerator />);
    const name = await currentName();
    await user.click(screen.getByRole("button", { name: "Favourite" }));
    unmount();

    render(<NameGenerator />);
    await currentName();
    const disclosure = screen.getByRole("button", { name: /Favourites \(1\)/ });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await user.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    const list = await screen.findByRole("list", { name: "Saved names" });
    expect(within(list).getByText(name)).toBeInTheDocument();

    await user.click(within(list).getByRole("button", { name: `Remove ${name}` }));
    await waitFor(() => expect(screen.queryByRole("list", { name: "Saved names" })).toBeNull());
  });

  it("asks before clearing all favourites", async () => {
    const user = userEvent.setup();
    render(<NameGenerator />);
    await currentName();
    await user.click(screen.getByRole("button", { name: "Favourite" }));
    await user.click(screen.getByRole("button", { name: /Favourites/ }));
    await user.click(await screen.findByRole("button", { name: "Clear all" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Keep them" }));
    expect(JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? "[]")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Clear all" }));
    expect(JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? "[]")).toHaveLength(0);
  });

  it("makes no network requests and stores only generated-name IDs", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup();
    render(<NameGenerator />);
    await currentName();
    await regenerate(user);
    expect(fetchSpy).not.toHaveBeenCalled();
    const snapshot = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}");
    for (const id of snapshot.emitted) expect(id).toMatch(/^g:[a-z]+\|(s:[a-z]+|c:[a-z]+~[a-z]+)$/);
    vi.unstubAllGlobals();
  });

  it("still works when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const user = userEvent.setup();
    render(<NameGenerator />);
    const first = await currentName();
    await regenerate(user);
    expect(await currentName()).not.toBe(first);
  });
});
