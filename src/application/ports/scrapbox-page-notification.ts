export interface IScrapboxPageNotification {
  projectName(projectName: string): this;
  title(title: string): this;
  content(content: string): this;
  lines(lines: string[]): this;
}
