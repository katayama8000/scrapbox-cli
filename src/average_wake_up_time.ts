import { formatDate } from "./libs/formatDate";
import type { PageResponse } from "./types/PageResponse";

// Asynchronous function: Fetches the average wake-up time for the week from Scrapbox API
const getWakeUpTime = async (pageDate: string): Promise<string> => {
    const pageUrl = `https://scrapbox.io/api/pages/katayama8000/${encodeURIComponent(pageDate)}`;

    try {
        const res = await fetch(pageUrl);
        if (!res.ok) {
            console.error(`No page found for ${pageDate}`);
        }
        const data: PageResponse = await res.json();
        const lines = data.lines;
        const index = lines.findIndex((line) => line.text.includes("起床時間"));
        if (index === -1 || !lines[index + 1]) {
            throw new Error("Wake-up time not found in the page.");
        }
        const wakeUpTime = lines[index + 1].text;
        console.log("Wake-up time:", wakeUpTime);
        return wakeUpTime;
    } catch (error) {
        console.error("Error fetching wake-up time:", error);
        return "Error fetching wake-up time";
    }
};

const buildThisWeeksPageTitle = (date: Date): string[] => {
    const week: string[] = [];

    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);

    Array.from({ length: 7 }).forEach((_, i) => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        const pageTitle = formatDate(currentDate, "yyyy/M/d (ddd)");
        week.push(pageTitle);
    });

    return week;
};

const main = async () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const thisWeeksPageTitles = buildThisWeeksPageTitle(date);

    const wakeUpTimes = await Promise.all(
        thisWeeksPageTitles.map((pageTitle) => getWakeUpTime(pageTitle)),
    );
    console.log("Wake-up times for the week:", wakeUpTimes);
    const filteredWakeUpTimes = wakeUpTimes.filter((time) => !time.includes("Error"));
    const parseMinutesToNumber = (time: string): number => {
        const [hour, minute] = time.split(":").map(Number);
        return hour + minute / 60;
    }

    const averageWakeUpTime =
        filteredWakeUpTimes.reduce((acc, time) => acc + parseMinutesToNumber(time), 0) /
        filteredWakeUpTimes.length;

    console.log("Average wake-up time for the week:", averageWakeUpTime);
};

main().catch(console.error);
