import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate.ts";
import { ScrapboxPayloadBuilder } from "@/infrastructure/adapters/scrapbox/scrapbox-payload-builder.ts";

export class CalculateAverageSleepQualityUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly dateProvider: DateProvider,
  ) {}

  async execute(projectName: string): Promise<number> {
    const thisWeeksPageTitles = this.buildThisWeeksPageTitle();
    const sleepQualities = await Promise.all(
      thisWeeksPageTitles.map((title) =>
        this.fetchSleepQuality(projectName, title)
      ),
    );
    const filteredSleepQualities = sleepQualities.filter((quality) => {
      if (!quality) return false;
      const trimmedQuality = quality.trim();
      return (
        /^[1-5]$/.test(trimmedQuality) && !trimmedQuality.includes("Error")
      );
    });

    if (filteredSleepQualities.length === 0) {
      return 0;
    }

    return this.calculateAverageSleepQuality(
      filteredSleepQualities as string[],
    );
  }

  private async fetchSleepQuality(
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

    const index = lines.findIndex((line) =>
      line.includes("Score sleep quality")
    );
    if (index === -1 || !lines[index + 1]) {
      return null;
    }
    return lines[index + 1];
  }

  private buildThisWeeksPageTitle(): string[] {
    const dayjs = DateProviderImpl.getDayjs();
    const today = dayjs(this.dateProvider.now());
    const day = today.day();
    const startOfWeek = day === 0
      ? today.subtract(6, "day")
      : today.subtract(day - 1, "day");
    return Array.from({ length: 7 }, (_, i) => {
      const currentDate = startOfWeek.add(i, "day");
      return formatDate(currentDate, "yyyy/M/d (ddd)");
    });
  }

  private parseScore(score: string): number {
    return parseInt(score, 10);
  }

  private calculateAverageSleepQuality(scores: string[]): number {
    const trimmedScores = scores.map((score) => score.trim());
    if (!trimmedScores.every((score) => /^[1-5]$/.test(score))) {
      throw new Error("Invalid score format. Please use a number from 1 to 5.");
    }
    const totalScore = trimmedScores.reduce(
      (acc, score) => acc + this.parseScore(score),
      0,
    );
    const average = totalScore / trimmedScores.length;
    return Math.round(average * 100) / 100;
  }
}
