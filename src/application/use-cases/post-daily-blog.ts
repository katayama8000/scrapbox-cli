import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate.ts";
import { formatTextItems } from "@/infrastructure/adapters/formatters/formatTextItems.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { ScrapboxPayloadBuilder } from "@/infrastructure/adapters/scrapbox/scrapbox-payload-builder.ts";

const dailyTemplate = {
  buildText: (connectLink: string): string => {
    return formatTextItems([
      { content: "Wake-up Time", format: "medium" },
      { content: "Today's Tasks", format: "medium" },
      {
        content: "https://tatsufumi.backlog.com/board/FAMILY",
        format: "plain",
      },
      { content: "Score sleep quality", format: "medium" },
      { content: "How was the day?", format: "medium" },
      { content: connectLink, format: "link" },
      { content: "daily", format: "link" },
    ]);
  },
  generateTitle: (date: Date): string =>
    formatDate(DateProviderImpl.getDayjs()(date), "yyyy/M/d (ddd)"),
};

export class PostDailyBlogUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly dateProvider: DateProvider,
  ) {}

  async execute(projectName: string): Promise<void> {
    const today = this.dateProvider.now();
    const title = dailyTemplate.generateTitle(today);
    const connectLinkText = this.getConnectLinkText(today);
    const content = dailyTemplate.buildText(connectLinkText);

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
    const startOfWeek = isSunday
      ? d.subtract(6, "day")
      : d.subtract(d.day() - 1, "day");
    const endOfWeek = startOfWeek.add(6, "day");
    return `${formatDate(startOfWeek, "yyyy/M/d")}~${
      formatDate(
        endOfWeek,
        "yyyy/M/d",
      )
    }`;
  }
}
