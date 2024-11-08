import { dayjs } from "./libs/dayJs";
import { formatDate } from "./libs/formatDate";

const fetchWakeUpTime = async (pageDate: string): Promise<string> => {
    const client = (await import("@katayama8000/cosense-client")).CosenseClient("katayama8000");

    try {
        const data = await client.getPage(pageDate);
        const index = data.lines.findIndex(line => line.text.includes("起床時間"));
        if (index === -1 || !data.lines[index + 1]) {
            return "Error fetching wake-up time";
        }
        return data.lines[index + 1].text;
    }
    catch (e) {
        return "Error fetching wake-up time";
    }
};

const buildThisWeeksPageTitle = (): string[] => {
    const today = dayjs()
    const day = today.day()
    const startOfWeek = today.subtract(day - 1, "day")
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

export const main = async () => {
    const thisWeeksPageTitles = buildThisWeeksPageTitle();

    const wakeUpTimes = await Promise.all(thisWeeksPageTitles.map(fetchWakeUpTime));
    const filteredWakeUpTimes = wakeUpTimes.filter(time => !time.includes("Error"));

    const averageWakeUpTime = calculateAverageWakeUpTime(filteredWakeUpTimes);
    console.log("this week page title", thisWeeksPageTitles);
    console.log("Average wake-up time for the week:", averageWakeUpTime);

    return averageWakeUpTime;
};

main().catch(console.error);