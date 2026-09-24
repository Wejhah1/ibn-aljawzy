import "server-only";

export async function renderHtmlToPdf(
  html: string,
  options: { width: string; height: string; landscape?: boolean; margin?: string }
): Promise<Buffer> {
  let browser;

  if (process.env.NODE_ENV === "development") {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ headless: true });
  } else {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = await import("puppeteer-core");
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      width: options.width,
      height: options.height,
      landscape: options.landscape ?? false,
      printBackground: true,
      preferCSSPageSize: false,
      ...(options.margin ? { margin: { top: options.margin, bottom: options.margin, left: options.margin, right: options.margin } } : {}),
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function renderHtmlToPng(html: string, width: number, height: number): Promise<Buffer> {
  let browser;

  if (process.env.NODE_ENV === "development") {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ headless: true });
  } else {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = await import("puppeteer-core");
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "load" });
    const png = await page.screenshot({ type: "png" });
    return Buffer.from(png);
  } finally {
    await browser.close();
  }
}
