/**
 * Draws a 1200 × 630 name card (a common social-preview size) on a canvas and
 * downloads it as a PNG. Runs entirely in the browser from the generated name
 * alone; nothing is uploaded.
 */
const WIDTH = 1200;
const HEIGHT = 630;

const COLOURS = {
  paper: "#f5eedf",
  card: "#fbf7ee",
  ink: "#1d1714",
  inkSoft: "#4a3f38",
  oxblood: "#6b1424",
  gold: "#a5813f",
  rule: "#cbb991",
};

/** Resolve the page's actual font family names (next/font hashes them). */
function fontFamilies(): { display: string; ui: string } {
  const style = getComputedStyle(document.body);
  const display = style.getPropertyValue("--font-display").trim() || "Georgia, serif";
  const ui = style.getPropertyValue("--font-ui").trim() || "system-ui, sans-serif";
  return { display, ui };
}

/** Largest font size (px) at which `text` fits `maxWidth`, wrapping to at most two lines. */
function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  maxWidth: number,
): { size: number; lines: string[] } {
  for (let size = 120; size >= 40; size -= 4) {
    ctx.font = `700 ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return { size, lines: [text] };
    const words = text.split(" ");
    for (let split = words.length - 1; split >= 1; split--) {
      const a = words.slice(0, split).join(" ");
      const b = words.slice(split).join(" ");
      if (ctx.measureText(a).width <= maxWidth && ctx.measureText(b).width <= maxWidth && size <= 100) {
        return { size, lines: [a, b] };
      }
    }
  }
  return { size: 40, lines: [text] };
}

function drawLozenge(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.strokeStyle = COLOURS.gold;
  ctx.fillStyle = COLOURS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 150, cy);
  ctx.lineTo(cx - 24, cy);
  ctx.moveTo(cx + 24, cy);
  ctx.lineTo(cx + 150, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx + 10, cy);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx - 10, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5);
  ctx.lineTo(cx + 5, cy);
  ctx.lineTo(cx, cy + 5);
  ctx.lineTo(cx - 5, cy);
  ctx.closePath();
  ctx.fill();
}

export async function renderNameCard(display: string, label: string): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  const { display: displayFont, ui } = fontFamilies();

  ctx.fillStyle = COLOURS.paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = COLOURS.card;
  ctx.fillRect(36, 36, WIDTH - 72, HEIGHT - 72);
  ctx.strokeStyle = COLOURS.rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, WIDTH - 100, HEIGHT - 100);

  drawLozenge(ctx, WIDTH / 2, 120);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLOURS.inkSoft;
  ctx.font = `600 22px ${ui}`;
  ctx.fillText(label.toUpperCase().split("").join(" "), WIDTH / 2, 175);

  const { size, lines } = fitLines(ctx, display, displayFont, WIDTH - 200);
  ctx.fillStyle = COLOURS.ink;
  ctx.font = `700 ${size}px ${displayFont}`;
  const lineHeight = size * 1.1;
  const top = 330 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, WIDTH / 2, top + i * lineHeight));

  ctx.fillStyle = COLOURS.oxblood;
  ctx.font = `italic 500 28px ${displayFont}`;
  ctx.fillText("A name of considerable distinction.", WIDTH / 2, 490);

  ctx.fillStyle = COLOURS.inkSoft;
  ctx.font = `400 18px ${ui}`;
  ctx.fillText("Toast Name Generator · an unofficial fan-inspired generator", WIDTH / 2, 545);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"),
  );
}

export function cardFileName(display: string): string {
  const slug = display
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `toast-name-${slug || "card"}.png`;
}

export async function downloadNameCard(display: string, label: string): Promise<void> {
  const blob = await renderNameCard(display, label);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = cardFileName(display);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
