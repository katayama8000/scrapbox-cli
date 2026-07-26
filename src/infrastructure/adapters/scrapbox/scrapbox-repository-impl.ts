import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { checkPageExist } from "@/infrastructure/adapters/scrapbox/checkPageExist.ts";
import { postToScrapbox } from "@/infrastructure/adapters/scrapbox/postToScrapbox.ts";
import { updateScrapboxPage } from "@/infrastructure/adapters/scrapbox/updateScrapboxPage.ts";
import { parse } from "@progfay/scrapbox-parser";
import { ScrapboxPayloadBuilder } from "./scrapbox-payload-builder.ts";

export class ScrapboxRepositoryImpl implements ScrapboxRepository {
  constructor(private readonly sessionId: string) {}

  private parseCreatedAt(created?: number): Date | null {
    if (typeof created !== "number" || Number.isNaN(created)) {
      return null;
    }

    const milliseconds = created < 1_000_000_000_000 ? created * 1000 : created;
    const createdAt = new Date(milliseconds);

    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return createdAt;
  }

  private parseTextLine(pageText: string): string[] {
    const parsedPage = parse(pageText, { hasTitle: true });
    return parsedPage
      .filter((block): block is Extract<typeof block, { type: "line" }> =>
        block.type === "line"
      )
      .map((line) => {
        const text = line.nodes
          .map((node) => {
            if ("raw" in node && typeof node.raw === "string") {
              return node.raw;
            }
            if ("text" in node && typeof node.text === "string") {
              return node.text;
            }
            return "";
          })
          .join("");
        return `${" ".repeat(line.indent)}${text}`;
      });
  }

  async post(page: ScrapboxPage): Promise<void> {
    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { projectName, title, content } = builder.build();

    const pageExists = await this.exists(projectName, title);
    if (pageExists) {
      await updateScrapboxPage(this.sessionId, projectName, title, content);
    } else {
      await postToScrapbox(this.sessionId, projectName, title, content);
    }
  }

  async update(page: ScrapboxPage): Promise<void> {
    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { projectName, title, content } = builder.build();

    await updateScrapboxPage(this.sessionId, projectName, title, content);
  }

  async exists(projectName: string, title: string): Promise<boolean> {
    return await checkPageExist(projectName, title);
  }

  async getPage(
    projectName: string,
    title: string,
  ): Promise<ScrapboxPage | null> {
    try {
      const encodedProjectName = encodeURIComponent(projectName);
      const encodedTitle = encodeURIComponent(title);
      const url =
        `https://scrapbox.io/api/pages/${encodedProjectName}/${encodedTitle}/text`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP Error! status: ${response.status}`);
      }

      const pageText = await response.text();
      const content = this.parseTextLine(pageText).join("\n");

      return ScrapboxPage.reconstruct({
        projectName,
        title,
        content,
      });
    } catch (error) {
      console.error("getPage error:", error);
      return null;
    }
  }

  async listPages(projectName: string): Promise<ScrapboxPage[] | null> {
    const limit = 1000;
    type ScrapboxPageListItem = {
      title: string;
      lines?: string[];
      created?: number;
    };
    const fetchAllPages = async (
      skip: number,
      pages: ScrapboxPage[],
      totalCount: number | null,
    ): Promise<ScrapboxPage[]> => {
      const url =
        `https://scrapbox.io/api/pages/${projectName}?skip=${skip}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`);
      }

      const data = await response.json();
      const resolvedTotalCount = totalCount ?? data.count;
      const fetchedItems = (data.pages ?? []) as ScrapboxPageListItem[];
      const fetchedPages = fetchedItems.map((item) => {
        return ScrapboxPage.reconstruct({
          projectName,
          title: item.title,
          content: item.lines?.join("\n") ?? "",
          createdAt: this.parseCreatedAt(item.created),
        });
      });
      const nextPages = pages.concat(fetchedPages);
      const nextSkip = skip + fetchedPages.length;

      if (fetchedPages.length === 0 || nextSkip >= resolvedTotalCount) {
        return nextPages;
      }

      return await fetchAllPages(nextSkip, nextPages, resolvedTotalCount);
    };

    try {
      return await fetchAllPages(0, [], null);
    } catch (error) {
      console.error("Failed to fetch Scrapbox pages:", error);
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

  async listPagesByPageTitle(
    projectName: string,
    pageTitles: string[],
  ): Promise<ScrapboxPage[] | null> {
    try {
      const pages = await Promise.all(
        pageTitles.map((title) => this.getPage(projectName, title)),
      );
      return pages.filter((page): page is ScrapboxPage => page !== null);
    } catch (error) {
      console.error("Failed to fetch Scrapbox pages by title:", error);
      return null;
    }
  }
}
