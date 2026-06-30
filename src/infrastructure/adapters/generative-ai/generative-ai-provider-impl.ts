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
  `Summarize the content in one paragraph and tell me what I should focus on next. Do not collect, restate, or include items that are already covered by the template (average wake-up time, average sleep quality, and Today's Tasks). Please follow Scrapbox format by starting every line with 「>」 and write in English. The content is below:\n\n${v}`;
