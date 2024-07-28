import 'dotenv/config'
import { launch, type Page } from "puppeteer";

const DAILY_TEXT = "[* ルーティン]\n[* 起床時間]\n[* 感想]\n[* 明日すること]\n#daily";
const WEEKLY_TEXT = "[* 目標]\n[* 新しいこと]\n[* 振り返り]\n[* 感想]\n[* 日記]\n#weekly";

const checkPageExists = async (project: string, title: string): Promise<boolean> => {
    try {
        const res = await fetch(`https://scrapbox.io/api/pages/${project}/${encodeURIComponent(title)}`);
        if (!res.ok) {
            return false;
        }
        return true;
    } catch (error) {
        throw new Error(`Failed to fetch page: ${error}`);
    }
};

const createScrapboxPage = async (page: Page, url: string): Promise<void> => {
    try {
        await page.goto(url);
        console.log("Created Scrapbox page");
    } catch (error) {
        console.error("Failed to create Scrapbox page:", error);
    }
};

const writeToScrapbox = async (sid: string, project: string, title: string, text: string): Promise<void> => {
    const url = new URL(`https://scrapbox.io/${project}/${encodeURIComponent(title)}?body=${encodeURIComponent(text)}`);
    const browser = await launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    try {
        await page.setCookie({
            name: "connect.sid",
            value: sid,
            domain: "scrapbox.io",
        });

        const pageExists = await checkPageExists(project, title);
        if (pageExists) {
            console.error(`Page "${title}" already exists.`);
            return;
        }

        await createScrapboxPage(page, url.toString());
    } catch (error) {
        console.error("Failed to write to Scrapbox:", error);
    } finally {
        await browser.close();
    }
};

const generateTitles = () => {
    const today = new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60 * 1000);
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];

    const dailyTitle = `${year}/${month}/${date} (${day})`;
    const weeklyTitle = `${year}/${month}/${date} ~ ${year}/${month}/${date + 6}`;

    return { dailyTitle, weeklyTitle };
};

const main = async () => {
    if (process.argv.length !== 3) {
        console.error("Usage: yarn <daily|weekly>");
        process.exit(1);
    }

    const template = process.argv[2];
    const { dailyTitle, weeklyTitle } = generateTitles();
    const title = template === "daily" ? dailyTitle : weeklyTitle;
    const text = template === "daily" ? DAILY_TEXT : WEEKLY_TEXT;

    const sid = process.env.SCRAPBOX_SID;
    if (!sid) {
        console.error("Please set the SCRAPBOX_SID environment variable.");
        process.exit(1);
    }

    console.log(`Writing to Scrapbox: ${title}...`);

    await writeToScrapbox(sid, "katayama8000", title, text);
};

main().catch(console.error);
