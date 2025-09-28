import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate.ts";
import { formatTextItems } from "@/infrastructure/adapters/formatters/formatTextItems.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { ScrapboxPayloadBuilder } from "@/infrastructure/adapters/scrapbox/scrapbox-payload-builder.ts";

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
    generateTitle: (date: Date): string =>
      formatDate(DateProviderImpl.getDayjs()(date), "yyyy/M/d (ddd)"),
  },
};

export class PostSleepLogUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly dateProvider: DateProvider,
  ) {}

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

    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { projectName: pageProjectName, title: pageTitle } = builder.build();

    const pageExists = await this.scrapboxRepository.exists(
      pageProjectName,
      pageTitle,
    );
    if (pageExists) {
      throw new Error(`Page already exists: ${pageTitle}`);
    }

    console.log(`Writing to Scrapbox: ${pageTitle}...`);
    await this.scrapboxRepository.post(page);
    console.log("Successfully written to Scrapbox:", pageTitle);
  }
}
