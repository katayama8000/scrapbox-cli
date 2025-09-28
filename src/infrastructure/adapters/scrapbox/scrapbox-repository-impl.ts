import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { checkPageExist } from "@/infrastructure/adapters/scrapbox/checkPageExist.ts";
import { postToScrapbox } from "@/infrastructure/adapters/scrapbox/postToScrapbox.ts";
import { ScrapboxPayloadBuilder } from "./scrapbox-payload-builder.ts";

export class ScrapboxRepositoryImpl implements ScrapboxRepository {
  constructor(private readonly sessionId: string) {}

  async post(page: ScrapboxPage): Promise<void> {
    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { projectName, title, content } = builder.build();

    await postToScrapbox(this.sessionId, projectName, title, content);
  }

  async exists(projectName: string, title: string): Promise<boolean> {
    return await checkPageExist(projectName, title);
  }

  async getPage(
    projectName: string,
    title: string,
  ): Promise<ScrapboxPage | null> {
    try {
      const { getPage } = (
        await import("@katayama8000/cosense-client")
      ).CosenseClient(projectName);
      const data = await getPage(title);
      if (!data) return null;

      return ScrapboxPage.create({
        projectName,
        title,
        content: data.lines.map((l) => l.text).join("\n"),
        lines: data.lines.map((l) => l.text),
      });
    } catch (error) {
      console.error("getPage error:", error);
      return null;
    }
  }

  async getPageCount(projectName: string): Promise<number | null> {
    const url = `https://scrapbox.io/api/pages/${projectName}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`);
      }

      const data = await response.json();
      const pageCount: number = data.count;
      return pageCount;
    } catch (error) {
      console.error("Failed to fetch Scrapbox pages:", error);
      return null;
    }
  }
}
