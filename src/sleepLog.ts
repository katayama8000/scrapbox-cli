import "dotenv/config";
import { formatDate, type Dayjs, dayjs, formatTextItems, postToScrapbox } from "./libs";

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

const main = async () => {
    const projectName = "katayama8000";
    const template = TEMPLATES.sleepLog;
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
        await postToScrapbox(sessionId, projectName, title + " 睡眠ログ", templateContent);
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