import { IScrapboxPageNotification } from "@/application/ports/scrapbox-page-notification.ts";

export class ScrapboxPage {
  private constructor(
    private readonly projectName: string,
    private readonly title: string,
    private readonly content: string,
    private readonly lines?: string[],
  ) {}

  static create({
    projectName,
    title,
    content,
    lines,
  }: {
    projectName: string;
    title: string;
    content: string;
    lines?: string[];
  }): ScrapboxPage {
    return new ScrapboxPage(projectName, title, content, lines);
  }

  notify(notification: IScrapboxPageNotification): void {
    notification
      .projectName(this.projectName)
      .title(this.title)
      .content(this.content);
    if (this.lines) {
      notification.lines(this.lines);
    }
  }
}
