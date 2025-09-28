import "dotenv/load.ts";
import { type Browser, chromium, type Page } from "playwright";

export const createBrowserSession = async (
  sessionId: string,
): Promise<{ browser: Browser; page: Page }> => {
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "connect.sid",
      value: sessionId,
      domain: "scrapbox.io",
      path: "/",
    },
  ]);
  const page = await context.newPage();
  return { browser, page };
};
