import { IScrapboxPageNotification } from "../../../application/ports/scrapbox-page-notification";

export class ScrapboxPayloadBuilder implements IScrapboxPageNotification {
  private pageProjectName?: string;
  private pageTitle?: string;
  private pageContent?: string;
  private pageLines: string[] = [];

  projectName(projectName: string): this {
    this.pageProjectName = projectName;
    return this;
  }

  title(title: string): this {
    this.pageTitle = title;
    return this;
  }

  content(content: string): this {
    this.pageContent = content;
    return this;
  }

  lines(lines: string[]): this {
    this.pageLines = lines;
    return this;
  }

  build(): {
    projectName: string;
    title: string;
    content: string;
    lines: string[];
  } {
    if (!this.pageProjectName || !this.pageTitle || !this.pageContent) {
      throw new Error("Project name, title, and content must be provided.");
    }

    return {
      projectName: this.pageProjectName,
      title: this.pageTitle,
      content: this.pageContent,
      lines: this.pageLines,
    };
  }
}
