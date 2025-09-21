
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository";
import { DateProvider } from "@/application/ports/date-provider";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate";

export class CalculateAverageWakeUpTimeUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly dateProvider: DateProvider
  ) {}

  async execute(projectName: string): Promise<number> {
    const thisWeeksPageTitles = this.buildThisWeeksPageTitle();
    const wakeUpTimes = await Promise.all(
      thisWeeksPageTitles.map((title) => this.fetchWakeUpTime(projectName, title))
    );
    const filteredWakeUpTimes = wakeUpTimes.filter((time) => {
      if (!time) return false;
      const trimmedTime = time.trim();
      return /^[0-9]/.test(trimmedTime) && !trimmedTime.includes("Error");
    });

    if (filteredWakeUpTimes.length === 0) {
      return 0;
    }

    return this.calculateAverageWakeUpTime(filteredWakeUpTimes as string[]);
  }

  private async fetchWakeUpTime(projectName: string, pageTitle: string): Promise<string | null> {
    const page = await this.scrapboxRepository.getPage(projectName, pageTitle);
    if (!page || !page.lines) {
      return null;
    }
    const index = page.lines.findIndex((line) => line.includes("Wake-up Time"));
    if (index === -1 || !page.lines[index + 1]) {
      return null;
    }
    return page.lines[index + 1];
  }

  private buildThisWeeksPageTitle(): string[] {
    const dayjs = DateProviderImpl.getDayjs();
    const today = dayjs(this.dateProvider.now());
    const day = today.day();
    const startOfWeek = day === 0 ? today.subtract(6, "day") : today.subtract(day - 1, "day");
    return Array.from({ length: 7 }, (_, i) => {
      const currentDate = startOfWeek.add(i, "day");
      return formatDate(currentDate, "yyyy/M/d (ddd)");
    });
  }

  private parseMinToNum(time: string): number {
    const [hour, minute] = time.split(":").map(Number);
    return hour + minute / 60;
  }

  private calculateAverageWakeUpTime(times: string[]): number {
    const trimmedTimes = times.map((time) => time.trim());
    if (!trimmedTimes.every((time) => /^\d{1,2}:\d{2}$/.test(time))) {
      throw new Error("Invalid time format. Please use the format 'HH:mm'.");
    }
    const totalMinutes = trimmedTimes.reduce(
      (acc, time) => acc + this.parseMinToNum(time),
      0
    );
    return totalMinutes / trimmedTimes.length;
  }
}
