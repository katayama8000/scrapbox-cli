import { formatDate } from "./libs/formatDate";
import type { PageResponse } from "./types/PageResponse";

const fetchWakeUpTime = async (pageDate: string): Promise<string> => {
    const pageUrl = `https://scrapbox.io/api/pages/katayama8000/${encodeURIComponent(pageDate)}`;

    const res = await fetch(pageUrl);
    if (!res.ok) {
        console.error(`No page found for ${pageDate}`);
        return "Error fetching wake-up time";
    }

    const data: PageResponse = await res.json();
    const index = data.lines.findIndex(line => line.text.includes("起床時間"));

    if (index === -1 || !data.lines[index + 1]) {
        return "Error fetching wake-up time";
    }

    return data.lines[index + 1].text;
};

const buildThisWeeksPageTitle = (date: Date): string[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - (date.getDay() + 6) % 7);

    return Array.from({ length: 7 }, (_, i) => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        return formatDate(currentDate, "yyyy/M/d (ddd)");
    });
};

const parseMinToNum = (time: string): number => {
    const [hour, minute] = time.split(":").map(Number);
    return hour + minute / 60;
};

const calculateAverageWakeUpTime = (times: string[]): number => {
    const totalMinutes = times.reduce((acc, time) => acc + parseMinToNum(time), 0);
    return totalMinutes / times.length;
};

const main = async () => {
    const date = new Date();
    const thisWeeksPageTitles = buildThisWeeksPageTitle(date);
    const wakeUpTimes = await Promise.all(thisWeeksPageTitles.map(fetchWakeUpTime));
    const filteredWakeUpTimes = wakeUpTimes.filter(time => !time.includes("Error"));


    const averageWakeUpTime = calculateAverageWakeUpTime(filteredWakeUpTimes);
    console.log("Average wake-up time for the week:", averageWakeUpTime);
};

main().catch(console.error);