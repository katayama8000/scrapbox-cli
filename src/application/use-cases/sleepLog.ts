
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository";
import { DateProvider } from "@/application/ports/date-provider";
import { ScrapboxPage } from "@/domain/models/scrapbox-page";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate";
import { formatTextItems } from "@/infrastructure/adapters/formatters/formatTextItems";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl";

const TEMPLATES = {
  sleepLog: {
    buildText: (): string => {
      return formatTextItems([
        { content: "Time I tried to sleep", format: "plain" },
        { content: "Time I fell asleep", format: "plain" },
        { content: "Time I woke up", format: "plain" },
        { content: "What I was doing before sleep", format: "plain" },
        { content: "Thoughts", format: "plain" },
        { content: "What to do before sleep tonight", format: "plain" },
        { content: "Sleep improvement", format: "link" },
      ]);
    },
    generateTitle: (date: Date): string => formatDate(DateProviderImpl.getDayjs()(date), "yyyy/M/d (ddd)"),
  },
};

export class PostSleepLogUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly dateProvider: DateProvider
  ) { }

  async execute(projectName: string): Promise<void> {
    const template = TEMPLATES.sleepLog;
    const today = this.dateProvider.now();
    const title = template.generateTitle(today);
    const content = template.buildText();

    const page = ScrapboxPage.create({
      projectName,
      title: title + " 睡眠ログ",
      content,
    });

    const pageExists = await this.scrapboxRepository.exists(page);
    if (pageExists) {
      console.error(`Page already exists: ${page.title}`);
      throw new Error("Page already exists");
    }

    console.log(`Writing to Scrapbox: ${page.title}...`);
    await this.scrapboxRepository.post(page);
    console.log("Successfully written to Scrapbox:", page.title);
  }
}
