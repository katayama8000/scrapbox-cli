import "dotenv/config";
import { launch, type Page, type Browser } from "puppeteer";

export const createBrowserSession = async (
  sessionId: string,
): Promise<{ browser: Browser; page: Page }> => {
  const browser = await launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: "connect.sid",
    value: sessionId,
    domain: "scrapbox.io",
  });
  return { browser, page };
};
