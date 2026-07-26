import { IScrapboxPageNotification } from "@/application/ports/scrapbox-page-notification.ts";

export class ScrapboxPage {
  private constructor(
    private readonly projectName: string,
    private readonly title: string,
    private readonly content: string,
    private readonly createdAt: Date | null,
  ) {}

  static create({
    projectName,
    title,
    content,
    createdAt,
  }: {
    projectName: string;
    title: string;
    content: string;
    createdAt?: Date | null;
  }): ScrapboxPage {
    return new ScrapboxPage(projectName, title, content, createdAt ?? null);
  }

  static reconstruct({
    projectName,
    title,
    content,
    createdAt,
  }: {
    projectName: string;
    title: string;
    content: string;
    createdAt?: Date | null;
  }): ScrapboxPage {
    return new ScrapboxPage(projectName, title, content, createdAt ?? null);
  }

  update({ content }: { content: string }): ScrapboxPage {
    return new ScrapboxPage(
      this.projectName,
      this.title,
      content,
      this.createdAt,
    );
  }

  notify(notification: IScrapboxPageNotification): void {
    notification
      .projectName(this.projectName)
      .title(this.title)
      .content(this.content);
  }

  // Getters
  getProjectName(): string {
    return this.projectName;
  }

  getTitle(): string {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }

  getCreatedAt(): Date | null {
    return this.createdAt;
  }
}
