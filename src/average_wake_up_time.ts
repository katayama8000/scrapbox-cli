import { dayjs } from "./libs/dayJs";
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

const buildThisWeeksPageTitle = (): string[] => {
    const today = dayjs()
    const date = today.date()
    const startOfWeek = today.subtract(date, "day")
    return Array.from({ length: 7 }, (_, i) => {
        const currentDate = startOfWeek.add(i, "day");
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
    const thisWeeksPageTitles = buildThisWeeksPageTitle();
    console.log("This week's page titles:", thisWeeksPageTitles);
    const wakeUpTimes = await Promise.all(thisWeeksPageTitles.map(fetchWakeUpTime));
    const filteredWakeUpTimes = wakeUpTimes.filter(time => !time.includes("Error"));
    console.log("Wake-up times for the week:", filteredWakeUpTimes);


    const averageWakeUpTime = calculateAverageWakeUpTime(filteredWakeUpTimes);
    console.log("Average wake-up time for the week:", averageWakeUpTime);
};

main().catch(console.error);