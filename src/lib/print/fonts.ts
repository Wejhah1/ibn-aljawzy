import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedFont: string | null = null;

export async function getScriptFontDataUri(): Promise<string> {
  if (cachedFont) return cachedFont;
  const fontPath = path.join(process.cwd(), "public", "fonts", "TheYearOfHandicrafts-Regular.otf");
  const buf = await readFile(fontPath);
  cachedFont = `data:font/otf;base64,${buf.toString("base64")}`;
  return cachedFont;
}

let cachedLogo: string | null = null;

export async function getLogoDataUri(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const logoPath = path.join(process.cwd(), "public", "logo.svg");
  const buf = await readFile(logoPath);
  cachedLogo = `data:image/svg+xml;base64,${buf.toString("base64")}`;
  return cachedLogo;
}
