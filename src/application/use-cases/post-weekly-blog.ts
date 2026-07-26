import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate.ts";
import { formatTextItems } from "@/infrastructure/adapters/formatters/formatTextItems.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { CalculateAverageWakeUpTimeUseCase } from "@/application/use-cases/calculate_average_wake_up_time.ts";
import { CalculateAverageSleepQualityUseCase } from "@/application/use-cases/calculate_average_sleep_quality.ts";

import { ScrapboxPayloadBuilder } from "@/infrastructure/adapters/scrapbox/scrapbox-payload-builder.ts";
import { GenerativeAIProvider } from "../ports/generative-ai-provider.ts";

// export for testing
export const weeklyTemplate = {
  buildText: (
    connectLink: string,
    avgWakeUpTime: number,
    avgSleepQuality: number,
    summary: string,
  ): string => {
    return formatTextItems([
      { content: "Last week's average wake-up time", format: "medium" },
      { content: ` ${avgWakeUpTime.toString()}h`, format: "plain" },
      { content: "Last week's average sleep quality", format: "medium" },
      { content: ` ${avgSleepQuality.toString()}`, format: "plain" },
      { content: "Goals", format: "medium" },
      { content: "Try something new", format: "medium" },
      { content: "How was the week", format: "medium" },
      { content: "Summary", format: "medium" },
      { content: summary, format: "plain" },
      { content: connectLink, format: "link" },
      { content: "weekly", format: "link" },
    ]);
  },
  generateTitle: (date: Date): string => {
    const dayjs = DateProviderImpl.getDayjs();
    const d = dayjs(date);
    const startOfNextWeek = d.add(1, "day");
    const endOfNextWeek = startOfNextWeek.add(6, "day");
    return `${formatDate(startOfNextWeek, "yyyy/M/d")} ~ ${
      formatDate(
        endOfNextWeek,
        "yyyy/M/d",
      )
    }`;
  },
  buildSummaryPrompt: (pages: ScrapboxPage[]): string => {
    const articleBlocks = pages
      .map((page, index) => {
        return [
          `Article ${index + 1}: ${page.getTitle()}`,
          "Body:",
          page.getContent(),
        ].join("\n");
      })
      .join("\n\n");

    return [
      "You are preparing a coherent weekly reflection from multiple notes.",
      "Read all articles and write one connected summary in English.",
      "Requirements:",
      "- Write exactly one paragraph with 4-6 sentences.",
      "- Organize the paragraph in this order:",
      "  1) overall weekly theme, 2) concrete progress/examples, 3) challenges and learnings, 4) short closing insight.",
      "- Cover major themes shared across the week.",
      "- Mention concrete progress, challenges, and notable learnings.",
      "- Keep the flow natural as one narrative, not a bullet list.",
      "- Use transition words so each sentence connects logically (for example: first, then, however, finally).",
      "- Keep it concise (about 110-160 words).",
      "- Do not add information that is not present in the articles.",
      "",
      "Articles:",
      articleBlocks,
      "",
      "Return only the final summary paragraph.",
    ].join("\n");
  },
};

export class PostWeeklyBlogUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly dateProvider: DateProvider,
    private readonly calculateAverageWakeUpTimeUseCase:
      CalculateAverageWakeUpTimeUseCase,
    private readonly calculateAverageSleepQualityUseCase:
      CalculateAverageSleepQualityUseCase,
    private readonly generativeAIProvider: GenerativeAIProvider,
  ) {}

  async execute(projectName: string): Promise<void> {
    const today = this.dateProvider.now();
    const title = weeklyTemplate.generateTitle(today);
    const connectLinkText = this.getConnectLinkText(today);
    const avgWakeUpTime = await this.calculateAverageWakeUpTimeUseCase.execute(
      projectName,
    );
    const avgSleepQuality = await this.calculateAverageSleepQualityUseCase
      .execute(projectName);
    const relatedPages = await this.listPagesCreatedThisWeek(
      projectName,
      today,
    );
    if (!relatedPages || relatedPages === null || relatedPages.length === 0) {
      throw new Error("No related pages found for this week.");
    }

    const prompt = weeklyTemplate.buildSummaryPrompt(relatedPages);

    let summary: string;
    try {
      summary = await this.generativeAIProvider.generateContentEn(prompt);
    } catch (error) {
      console.error(
        "Failed to generate summary with generative AI. Creating page without summary.",
        error,
      );
      summary =
        "AI summary generation failed. Please check the related pages for details.";
    }

    const content = weeklyTemplate.buildText(
      connectLinkText,
      avgWakeUpTime,
      avgSleepQuality,
      summary,
    );

    const page = ScrapboxPage.create({ projectName, title, content });

    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { projectName: pageProjectName, title: pageTitle } = builder.build();

    if (await this.scrapboxRepository.exists(pageProjectName, pageTitle)) {
      throw new Error(`Page already exists: ${pageTitle}`);
    }

    await this.scrapboxRepository.post(page);
  }

  private getConnectLinkText(date: Date): string {
    const dayjs = DateProviderImpl.getDayjs();
    const d = dayjs(date);
    const isSunday = d.day() === 0;
    const startOfWeek = isSunday ? d.add(1, "day") : d.add(8 - d.day(), "day");
    const endOfWeek = startOfWeek.add(6, "day");
    return `${formatDate(startOfWeek, "yyyy/M/d")}~${
      formatDate(
        endOfWeek,
        "yyyy/M/d",
      )
    }`;
  }

  private async listPagesCreatedThisWeek(
    projectName: string,
    date: Date,
  ): Promise<ScrapboxPage[]> {
    const pages = await this.scrapboxRepository.listPages(projectName);
    if (!pages || pages.length === 0) {
      return [];
    }

    const [startDate, endDate] = this.getThisWeekRange(date);
    return pages
      .filter((page) => {
        const createdAt = page.getCreatedAt();
        if (!createdAt) {
          return false;
        }
        const time = createdAt.getTime();
        return time >= startDate.getTime() && time <= endDate.getTime();
      });
  }

  private getThisWeekRange(date: Date): [Date, Date] {
    const dayjs = DateProviderImpl.getDayjs();
    const today = dayjs(date);
    const day = today.day();
    const startOfWeek = day === 0
      ? today.subtract(6, "day")
      : today.subtract(day - 1, "day");

    return [
      startOfWeek.startOf("day").toDate(),
      startOfWeek.add(6, "day").endOf("day").toDate(),
    ];
  }
}
