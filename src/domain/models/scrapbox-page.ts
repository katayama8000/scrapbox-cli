export class ScrapboxPage {
  private constructor(
    public readonly projectName: string,
    public readonly title: string,
    public readonly content: string,
    public readonly lines?: string[],
  ) { }

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
}