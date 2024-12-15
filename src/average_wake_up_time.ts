import { dayjs } from "./libs/dayJs";
import { formatDate } from "./libs/formatDate";

const fetchWakeUpTime = async (pageDate: string): Promise<string> => {
    try {
        const client = (await import("@katayama8000/cosense-client")).CosenseClient("katayama8000");
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
    const today = dayjs();
    const day = today.day();
    const startOfWeek = day === 0 ? today.subtract(6, "day") : today.subtract(day - 1, "day");
    return Array.from({ length: 7 }, (_, i) => {
        const currentDate = startOfWeek.add(i, "day");
        return formatDate(currentDate, "yyyy/M/d (ddd)");
    });
};

const parseMinToNum = (time: string): number => {
    const [hour, minute] = time.split(":").map(Number);
    return hour + minute / 60;
};

/**
 * Calculate the average wake-up time from the given times.
 * @param times - The wake-up times to calculate the average from. times must be in the format "HH:mm".
 * @returns The average wake-up time in hours.
 */
const calculateAverageWakeUpTime = (times: string[]): number => {
    const trimmedTimes = times.map(time => time.trim());
    if (!trimmedTimes.every(time => /^\d{1,2}:\d{2}$/.test(time))) {
        throw new Error("Invalid time format. Please use the format 'HH:mm'.");
    }
    const totalMinutes = trimmedTimes.reduce((acc, time) => acc + parseMinToNum(time), 0);
    return totalMinutes / trimmedTimes.length;
};

export const main = async () => {
    const thisWeeksPageTitles = buildThisWeeksPageTitle();
    const wakeUpTimes = await Promise.all(thisWeeksPageTitles.map(fetchWakeUpTime));
    const filteredWakeUpTimes = wakeUpTimes.filter(time => {
        const trimmedTime = time.trim();
        return /^[0-9]/.test(trimmedTime) && !trimmedTime.includes("Error");
    });
    const averageWakeUpTime = calculateAverageWakeUpTime(filteredWakeUpTimes);
    return averageWakeUpTime;
};

main().catch(console.error);