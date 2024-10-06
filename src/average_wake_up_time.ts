import { formatDate } from "./libs/formatDate";
import type { PageResponse } from "./types/PageResponse";

// Asynchronous function: Fetches the average wake-up time for the week from Scrapbox API
const getAverageWeeklyWakeUpTime = async (
    pageDate: string,
): Promise<string> => {
    const pageUrl = `https://scrapbox.io/api/pages/katayama8000/${encodeURIComponent(pageDate)}`;

    try {
        const res = await fetch(pageUrl);
        if (!res.ok) {
            throw new Error(`Failed to fetch the page: ${res.statusText}`);
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

const buildThisWeekPageTitle = (date: Date): string[] => {
    const week = [];

    // Calculate the start of the week (Monday) based on the current date
    const startOfWeek = new Date("2024-10-010T00:00:00.000Z");
    console.log(date.getDate());
    console.log(date.getDay());
    console.log((date.getDay() + 6) % 7);
    startOfWeek.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Adjust to get the Monday of the current week

    // Loop through the week from Monday to Sunday
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i); // Set the date for the week
        week.push(formatDate(day, "yyyy/M/d (ddd)")); // Format the date
    }

    return week;
};



