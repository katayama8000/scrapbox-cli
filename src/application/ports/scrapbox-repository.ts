import { ScrapboxPage } from "@/domain/models/scrapbox-page";

export interface ScrapboxRepository {
  post(page: ScrapboxPage): Promise<void>;
  exists(page: Pick<ScrapboxPage, "projectName" | "title">): Promise<boolean>;
  getPage(projectName: string, title: string): Promise<ScrapboxPage | null>;
}