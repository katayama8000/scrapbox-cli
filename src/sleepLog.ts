import "dotenv/config";
import { launch, type Page, type Browser } from "puppeteer";
import { formatDate } from "./libs/formatDate";
import { type Dayjs, dayjs } from "./libs/dayJs";
import { formatTextItems } from "./libs/formatTextItems";
import { checkPageExist } from "./libs/checkPageExist";
import { createBrowserSession } from "./libs/createBrowserSession";


const TEMPLATES = {
    sleepLog: {
        buildText: (): string => {
            return formatTextItems([
                { content: "Time I tried to sleep", format: "plain" },
                { content: "Time I fell asleep", format: "plain" },
                { content: "Time I woke up", format: "plain" },
                { content: "What I was doing before sleep", format: "plain" },
                { content: "Thoughts", format: "plain" },
                { content: "What to do before sleep tonight", format: "plain" },
                { content: "Sleep improvement", format: "link" },
            ]);
        },
        generateTitle: (date: Dayjs): string => formatDate(date, "yyyy/M/d (ddd)")
    },
};

const postToScrapbox = async (
    sessionId: string,
    projectName: string,
    title: string,
    content: string | (() => Promise<string>)
): Promise<void> => {
    const body = typeof content === "function" ? await content() : content;
    const scrapboxUrl = new URL(
        `https://scrapbox.io/${projectName}/${encodeURIComponent(`${title} 睡眠ログ`)}?body=${encodeURIComponent(body)}`,
    );
    const { browser, page } = await createBrowserSession(sessionId);

    if (await checkPageExist(projectName, title)) {
        console.error(`Page already exists: ${title}`);
        throw new Error("Page already exists");
    }
    await page.goto(scrapboxUrl.toString());
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    await browser.close();
    console.log("Successfully written to Scrapbox:", title);
};

const main = async () => {
    const projectName = "katayama8000";
    const template = TEMPLATES["sleepLog"];
    const today = dayjs();
    const title = template.generateTitle(today);

    const templateContent = template.buildText();

    const sessionId = process.env.SCRAPBOX_SID;
    if (!sessionId) {
        console.error("Please set the SCRAPBOX_SID environment variable.");
        process.exit(1);
    }


    console.log(`Writing to Scrapbox: ${title}...`);
    try {
        await postToScrapbox(sessionId, projectName, title, templateContent);
    } catch (error) {
        console.error("Failed to write to Scrapbox:", error);
        throw new Error("Failed to write to Scrapbox");
    }
};

main().catch(
    (e) => {
        console.error(e);
        process.exit(1);
    }
);