import "dotenv/config";
import { formatDate } from "./libs/formatDate";
import { type Dayjs, dayjs } from "./libs/dayJs";
import { main as calculateAverageWakeUpTime } from "./average_wake_up_time";
import { formatTextItems } from "./libs/formatTextItems";
import { checkPageExist } from "./libs/checkPageExist";
import { createBrowserSession } from "./libs/createBrowserSession";


const TEMPLATES = {
    daily: {
        buildText: (connectLink: string, _todos: string[]): string => {
            // const todoItems: TextItem[] = todos.map(todo => {
            //     if (todo.includes("\t")) {
            //         return { content: todo.replace("\t", "").trim(), format: "nestedCheckbox" };
            //     }
            //     return { content: todo.trim(), format: "checkbox" };
            // });

            return formatTextItems([
                { content: "Wake-up Time", format: "paragraph1" },
                { content: "Today's Tasks", format: "paragraph1" },
                // ...todoItems,
                // { content: "Tomorrow's Tasks", format: "paragraph1" },
                { content: "Routine", format: "paragraph1" },
                { content: "Drink water", format: "nestedCheckbox" },
                { content: "Go outside", format: "nestedCheckbox" },
                { content: "Put phone on desk", format: "nestedCheckbox" },
                { content: "Thoughts", format: "paragraph1" },
                { content: connectLink, format: "link" },
                { content: "daily", format: "link" },
            ]);
        },
        generateTitle: (date: Dayjs): string => formatDate(date, "yyyy/M/d (ddd)")
    },
    weekly: {
        buildText: async (connectLink: string): Promise<string> => {
            const averageWakeUpTime = await calculateAverageWakeUpTime();
            return formatTextItems([
                { content: "Last week's average wake-up time", format: "strong" },
                { content: `${averageWakeUpTime.toString()}h`, format: "plain" },
                { content: "Goals", format: "strong" },
                { content: "New things", format: "strong" },
                { content: "Reflections", format: "strong" },
                { content: "Thoughts", format: "strong" },
                { content: connectLink, format: "link" },
                { content: "weekly", format: "link" },
            ]);
        },
        generateTitle: (date: Dayjs): string => {
            const startOfNextWeek = date.add(1, "day");
            const endOfNextWeek = startOfNextWeek.add(6, "day");
            return `${formatDate(startOfNextWeek, "yyyy/M/d")} ~ ${formatDate(endOfNextWeek, "yyyy/M/d")}`;
        },
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
        `https://scrapbox.io/${projectName}/${encodeURIComponent(title)}?body=${encodeURIComponent(body)}`,
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

const getConnectLinkText = (date: Dayjs, type: "weekly" | "daily"): string => {
    const isSunday = date.day() === 0;
    let startOfWeek: Dayjs;
    let endOfWeek: Dayjs;

    if (type === "weekly") {
        startOfWeek = isSunday ? date.add(1, "day") : date.add(8 - date.day(), "day");
        endOfWeek = startOfWeek.add(6, "day");
    } else {
        startOfWeek = isSunday ? date.subtract(6, "day") : date.subtract(date.day() - 1, "day");
        endOfWeek = startOfWeek.add(6, "day");
    }

    return `${formatDate(startOfWeek, "yyyy/M/d")}~${formatDate(endOfWeek, "yyyy/M/d")}`;
};

// const fetchTodaysTodos = async (projectName: string, pageTitle: string): Promise<string[]> => {
//     const { getPage } = (await import("@katayama8000/cosense-client")).CosenseClient(projectName);

//     try {
//         const data = await getPage(pageTitle);
//         const index = data.lines.findIndex(line => line.text.includes("明日すること"));
//         if (index === -1 || !data.lines[index + 1]) {
//             console.error("No '明日すること' section found in the page.");
//             return [];
//         }
//         const todos: string[] = [];
//         for (const line of data.lines.slice(index + 1)) {
//             if (line.text.startsWith("[* ")) {
//                 break;
//             }
//             todos.push(line.text);
//         }
//         return todos;
//     } catch (error) {
//         console.error("Failed to fetch today's todos:", error);
//         // ignore when error occurs
//         return [];
//     }
// };

const main = async () => {
    const templateType = process.argv[2] as keyof typeof TEMPLATES;
    if (!templateType || !TEMPLATES[templateType]) {
        console.error("Usage: pnpm <daily|weekly>");
        process.exit(1);
    }

    const projectName = "katayama8000";
    const template = TEMPLATES[templateType];

    const targetDate = templateType === "daily" ? dayjs().add(1, "day") : dayjs();
    const title = template.generateTitle(targetDate);
    const connectLinkText = getConnectLinkText(targetDate, templateType);
    const todos: string[] = [];
    const templateContent = await template.buildText(connectLinkText, todos);

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