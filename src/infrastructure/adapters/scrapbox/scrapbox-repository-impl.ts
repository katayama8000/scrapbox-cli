import { ScrapboxRepository } from "@/application/ports/scrapbox-repository";
import { ScrapboxPage } from "@/domain/models/scrapbox-page";
import { checkPageExist } from "@/infrastructure/adapters/scrapbox/checkPageExist";
import { postToScrapbox } from "@/infrastructure/adapters/scrapbox/postToScrapbox";

export class ScrapboxRepositoryImpl implements ScrapboxRepository {
  constructor(private readonly sessionId: string) {}

  async post(page: ScrapboxPage): Promise<void> {
    await postToScrapbox(
      this.sessionId,
      page.projectName,
      page.title,
      page.content
    );
  }

  async exists(page: Pick<ScrapboxPage, "projectName" | "title">): Promise<boolean> {
    return await checkPageExist(page.projectName, page.title);
  }

  async getPage(projectName: string, title: string): Promise<ScrapboxPage | null> {
    try {
      const { getPage } = (await import("@katayama8000/cosense-client")).CosenseClient(projectName);
      const data = await getPage(title);
      if (!data) return null;

      return {
        projectName,
        title,
        content: data.lines.map(l => l.text).join("\n"),
        lines: data.lines.map(l => l.text),
      };
    } catch (error) {
      console.error('getPage error:', error);
      return null;
    }
  }
}