import { ScrapboxRepository } from "@/application/ports/scrapbox-repository";
import { DateProvider } from "@/application/ports/date-provider";
import { ScrapboxPage } from "@/domain/models/scrapbox-page";

import {
  formatTextItems,
  TextItem,
} from "@/infrastructure/adapters/formatters/formatTextItems";

interface MonthlyStats {
  currentCount: number;
  previousCount: number | null;
  difference: number | null;
  currentMonth: string;
  previousMonth: string | null;
}

export class CountPagesUseCase {
  constructor(
    private scrapboxRepository: ScrapboxRepository,
    private dateProvider: DateProvider,
    private projectName: string,
  ) {}

  async getScrapboxPageCount(): Promise<number | null> {
    return await this.scrapboxRepository.getPageCount(this.projectName);
  }

  async getPreviousMonthPageCount(): Promise<number | null> {
    const now = this.dateProvider.now();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthString = this.formatMonthString(previousMonth);
    const previousMonthTitle = `Page Count ${previousMonthString}`;

    try {
      const exists = await this.scrapboxRepository.exists(
        this.projectName,
        previousMonthTitle,
      );

      if (!exists) {
        return null;
      }

      const page = await this.scrapboxRepository.getPage(
        this.projectName,
        previousMonthTitle,
      );

      if (!page) {
        return null;
      }

      // Extract page count from content using regex
      const match = page.toString().match(/Total pages: (\d+)/);
      return match ? parseInt(match[1], 10) : null;
    } catch (error) {
      console.error("Failed to fetch previous month page count:", error);
      return null;
    }
  }

  async getMonthlyStats(): Promise<MonthlyStats> {
    const now = this.dateProvider.now();
    const currentPageCount = await this.getScrapboxPageCount();
    const previousPageCount = await this.getPreviousMonthPageCount();

    if (currentPageCount === null) {
      throw new Error("Failed to get current page count");
    }

    const currentMonth = this.formatMonthString(now);

    const previousMonth =
      previousPageCount !== null
        ? this.formatMonthString(
            new Date(now.getFullYear(), now.getMonth() - 1, 1),
          )
        : null;
    const difference =
      previousPageCount !== null ? currentPageCount - previousPageCount : null;

    return {
      currentCount: currentPageCount,
      previousCount: previousPageCount,
      difference,
      currentMonth,
      previousMonth,
    };
  }

  async postMonthlyPageCount(): Promise<void> {
    const stats = await this.getMonthlyStats();
    await this.createMonthlyPageCountPage(stats);
  }

  private async createMonthlyPageCountPage(stats: MonthlyStats): Promise<void> {
    const now = this.dateProvider.now();
    const title = `Page Count ${stats.currentMonth}`;
    const dateString = this.formatDateString(now);

    const textItems: TextItem[] = [
      {
        content: `Total pages: ${stats.currentCount}`,
        format: "paragraph1",
      },
      { content: `Recorded on: ${dateString}`, format: "paragraph1" },
    ];

    // Add comparison with previous month if available
    if (stats.previousCount !== null && stats.difference !== null) {
      const changeText =
        stats.difference >= 0
          ? `📈 +${stats.difference} pages from ${stats.previousMonth}`
          : `📉 ${stats.difference} pages from ${stats.previousMonth}`;

      textItems.push(
        {
          content: `Previous month: ${stats.previousCount} pages`,
          format: "plain",
        },
        { content: changeText, format: "plain" },
      );
    } else {
      textItems.push({
        content: "Previous month data: Not available",
        format: "paragraph1",
      });
    }

    textItems.push({ content: "PageCount", format: "link" });

    const text = formatTextItems(textItems);

    const page = ScrapboxPage.create({
      projectName: this.projectName,
      title,
      content: text,
    });
    await this.scrapboxRepository.post(page);

    const changeInfo =
      stats.difference !== null
        ? ` (${stats.difference >= 0 ? "+" : ""}${
            stats.difference
          } from last month)`
        : "";

    console.log(
      `Posted monthly page count: ${stats.currentCount} pages${changeInfo}`,
    );
  }

  private formatMonthString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  private formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = dayNames[date.getDay()];
    return `${year}/${month}/${day} (${dayName})`;
  }
}
