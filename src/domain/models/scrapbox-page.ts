export type ScrapboxPage = {
  projectName: string;
  title: string;
  content: string | (() => Promise<string>);
  lines?: string[];
};