import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GenerativeAIProviderImpl implements GenerativeAIProvider {
  private readonly ai: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string, modelName: string): Promise<string> {
    const model = this.ai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  async generateContentJa(prompt: string): Promise<string> {
    return await this.generateContent(prompt, "gemini-2.5-flash-lite");
  }

  async generateContentEn(prompt: string): Promise<string> {
    const v = summaryTemplate(prompt);
    return await this.generateContent(v, "gemini-2.5-flash-lite");
  }
}

const summaryTemplate = (v: string) =>
  `You do not need to mention average wake-up time and average sleep quality and Today's Tasks, and I want to summarize it in one paragraph and you to tell me what I should focus on next. Please follow the scrapbox format using 「>」 in every line and write in English. The content is below:\n\n${v}`;
