
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate.ts";
import { ScrapboxPayloadBuilder } from "@/infrastructure/adapters/scrapbox/scrapbox-payload-builder.ts";

interface WakeUpTimeData {
  title: string;
  time: string | null;
}

export class VisualizeWeeklyWakeUpTimeUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly dateProvider: DateProvider,
  ) {}

  async execute(projectName: string): Promise<string> {
    const thisWeeksPageTitles = this.buildThisWeeksPageTitle();
    const wakeUpTimes = await Promise.all(
      thisWeeksPageTitles.map(async (title) => ({
        title,
        time: await this.fetchWakeUpTime(projectName, title),
      })),
    );

    return this.formatWakeUpTimes(wakeUpTimes);
  }

  private async fetchWakeUpTime(
    projectName: string,
    pageTitle: string,
  ): Promise<string | null> {
    const page = await this.scrapboxRepository.getPage(projectName, pageTitle);
    if (!page) {
      return null;
    }

    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { lines } = builder.build();

    if (!lines || lines.length === 0) {
      return null;
    }

    const index = lines.findIndex((line) => line.includes("Wake-up Time"));
    if (index === -1 || !lines[index + 1]) {
      return null;
    }
    const time = lines[index + 1].trim();
    console.log(`Fetched wake-up time for ${pageTitle}: ${time}`);
    return /^\d{1,2}:\d{2}$/.test(time) ? time : null;
  }

  private buildThisWeeksPageTitle(): string[] {
    const dayjs = DateProviderImpl.getDayjs();
    const today = dayjs();
    const day = today.day();
    // Sunday is 0, Monday is 1, etc.
    const startOfWeek = day === 0
      ? today.subtract(6, "day") // If Sunday, go back 6 days to Monday
      : today.subtract(day - 1, "day"); // Otherwise, go back to Monday

    return Array.from({ length: 6 }, (_, i) => {
      const currentDate = startOfWeek.add(i, "day");
      return formatDate(currentDate, "yyyy/M/d (ddd)") + " 睡眠ログ";
    });
  }

  private formatWakeUpTimes(wakeUpTimes: WakeUpTimeData[]): string {
    const dayMapping = {
      "(Mon)": "月",
      "(Tue)": "火",
      "(Wed)": "水",
      "(Thu)": "木",
      "(Fri)": "金",
      "(Sat)": "土",
    } as const;

    return wakeUpTimes
      .map(({ title, time }) => {
        const dayKey = Object.keys(dayMapping).find(key => title.includes(key)) as keyof typeof dayMapping | undefined;
        const day = dayKey ? dayMapping[dayKey] : "不明";
        const graph = time ? this.generateGraph(time) : "No data";
        return `${day}: ${graph}`;
      })
      .join("\n");
  }

  private generateGraph(time: string): string {
    const [hour, minute] = time.split(":").map(Number);
    const hourBlock = "[][][][][][][][][][]";
    const halfHourBlock = "[][][][][]";

    let graph = hourBlock.repeat(hour);
    if (minute >= 30) {
      graph += " " + halfHourBlock;
    }

    return graph.trim();
  }
}
