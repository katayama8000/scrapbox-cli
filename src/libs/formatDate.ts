import type { Dayjs } from "./dayJs";

export const formatDate = (date: Dayjs, format: string): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return format
        .replace("yyyy", date.year().toString())
        .replace("M", (date.month() + 1).toString().padStart(2, "0"))
        .replace("d", date.date().toString().padStart(2, "0"))
        .replace("ddd", days[date.day()]);
};
