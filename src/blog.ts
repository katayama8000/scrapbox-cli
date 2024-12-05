import "dotenv/config";
import { launch, type Page, type Browser } from "puppeteer";
import { formatDate } from "./libs/formatDate";
import { type Dayjs, dayjs } from "./libs/dayJs";
import { main as calculateAverageWakeUpTime } from "./average_wake_up_time";

type TextFormat = "link" | "strong" | "italic" | "strike" | "plain";

type TextItem = {
    content: string;
    format: TextFormat;
};

const templateBuilder = (items: TextItem[]): string => {
    return items
        .map(({ content, format }) => {
            switch (format) {
                case "link":
                    return `#${content}`;
                case "strong":
                    return `[* ${content}]`;
                case "italic":
                    return `[/ ${content}]`;
                case "strike":
                    return `[  ${content}]`;
                case "plain":
                    return content;
                default: {
                    const exhaustiveCheck: never = format;
                    throw new Error(`Unsupported format: ${exhaustiveCheck}`);
                }
            }
        })
        .join("\n");
};

const TEMPLATES = {
    daily: {
        getTemplateTextFn: (connectText: string) => {
            return templateBuilder([
                { content: "ルーティン", format: "strong" },
                { content: "水を飲む", format: "plain" },
                { content: "外に出る", format: "plain" },
                { content: "9:00までに始動", format: "plain" },
                { content: "起床時間", format: "strong" },
                { content: "感想", format: "strong" },
                { content: "明日すること", format: "strong" },
                { content: "daily", format: "link" },
                { content: connectText, format: "link" },
            ]);
        },
        getTitleFn: (date: Dayjs) => formatDate(date, "yyyy/M/d (ddd)")
    },
    weekly: {
        getTemplateTextFn: async (connectText: string) => {
            const wakeUpTime = await calculateAverageWakeUpTime();
            return templateBuilder([
                { content: "先週の平均起床時間", format: "strong" },
                { content: ` ${wakeUpTime.toString()}h`, format: "plain" },
                { content: "目標", format: "strong" },
                { content: "新しいこと", format: "strong" },
                { content: "振り返り", format: "strong" },
                { content: "感想", format: "strong" },
                { content: "日記", format: "strong" },
                { content: "weekly", format: "link" },
                { content: connectText, format: "link" },
            ]);
        },
        getTitleFn: (date: Dayjs) => {
            const startOfWeek = date.add(1, "day");
            const endOfWeek = startOfWeek.add(6, "day");
            return `${formatDate(startOfWeek, "yyyy/M/d")} ~ ${formatDate(endOfWeek, "yyyy/M/d")}`;
        },
    },
};

const checkPageExists = async (
    project: string,
    title: string,
): Promise<boolean> => {
    const client = (await import("@katayama8000/cosense-client")).CosenseClient(project);
    return await client.checkPageExist(title);
};

const initializeBrowser = async (
    sid: string,
): Promise<{ browser: Browser; page: Page }> => {
    const browser = await launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setCookie({
        name: "connect.sid",
        value: sid,
        domain: "scrapbox.io",
    });
    return { browser, page };
};

const writeToScrapbox = async (
    sid: string,
    project: string,
    title: string,
    text: string | (() => Promise<string>)
): Promise<void> => {
    const bodyContent = typeof text === "function" ? await text() : text;
    const scrapboxUrl = new URL(
        `https://scrapbox.io/${project}/${encodeURIComponent(title)}?body=${encodeURIComponent(bodyContent)}`,
    );
    const { browser, page } = await initializeBrowser(sid);

    if (await checkPageExists(project, title)) {
        console.error(`Page already exists: ${title}`);
        throw new Error("Page already exists");
    }
    await page.goto(scrapboxUrl.toString());
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    await browser.close();
    console.log("Successfully written to Scrapbox:", title);
};

const main = async () => {
    const templateType = process.argv[2] as keyof typeof TEMPLATES;
    if (!templateType || !TEMPLATES[templateType]) {
        console.error("Usage: yarn <daily|weekly>");
        process.exit(1);
    }

    const template = TEMPLATES[templateType];
    const today = dayjs().add(1, "day");
    const title = template.getTitleFn(today);

    const text = getConnectPageText(today, templateType);
    const templateText = await template.getTemplateTextFn(text);


    const sid = process.env.SCRAPBOX_SID;
    if (!sid) {
        console.error("Please set the SCRAPBOX_SID environment variable.");
        process.exit(1);
    }

    console.log(`Writing to Scrapbox: ${title}...`);

    try {
        await writeToScrapbox(sid, "katayama8000", title, templateText);
    } catch (error) {
        console.error("Failed to write to Scrapbox:", error);
    }
};

const getConnectPageText = (date: Dayjs, type: "weekly" | "daily"): string => {
    let startOfWeek: Dayjs;
    let endOfWeek: Dayjs;
    if (type === "weekly") {
        startOfWeek = date.day() === 0 ? date.add(1, "day") : date.add(8 - date.day(), "day");
        endOfWeek = startOfWeek.add(6, "day");
    } else {
        startOfWeek = date.day() === 0 ? date.subtract(6, "day") : date.subtract(date.day() - 1, "day");
        endOfWeek = startOfWeek.add(6, "day");
    }
    return `${formatDate(startOfWeek, "yyyy/M/d")}~${formatDate(endOfWeek, "yyyy/M/d")}`;
};

main().catch(console.error);
