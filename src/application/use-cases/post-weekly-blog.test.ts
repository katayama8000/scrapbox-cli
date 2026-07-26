import { assertEquals, assertStringIncludes } from "std/assert/mod.ts";
import { weeklyTemplate } from "./post-weekly-blog.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { PostWeeklyBlogUseCase } from "./post-weekly-blog.ts";
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { CalculateAverageWakeUpTimeUseCase } from "./calculate_average_wake_up_time.ts";
import { CalculateAverageSleepQualityUseCase } from "./calculate_average_sleep_quality.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { formatDate } from "@/infrastructure/adapters/formatters/formatDate.ts";

Deno.test("weeklyTemplate.buildText generates correct text", () => {
  const connectLink = "test-link";
  const avgWakeUpTime = 7.5;
  const avgSleepQuality = 4;
  const expected = "[**** Last week's average wake-up time]\n" +
    " 7.5h\n" +
    "[**** Last week's average sleep quality]\n" +
    " 4\n" +
    "[**** Goals]\n" +
    "[**** Try something new]\n" +
    "[**** How was the week]\n" +
    "[**** Summary]\n" +
    "Summary of the week\n" +
    "#test-link\n" +
    "#weekly";
  const result = weeklyTemplate.buildText(
    connectLink,
    avgWakeUpTime,
    avgSleepQuality,
    "Summary of the week",
  );
  assertEquals(result, expected);
});

Deno.test(
  "weeklyTemplate.generateTitle generates correct title for a given date",
  () => {
    const date = new Date("2026-02-21T00:00:00Z"); // Saturday
    const expected = "2026/02/22 ~ 2026/02/28";
    const result = weeklyTemplate.generateTitle(date);
    assertEquals(result, expected);
  },
);

Deno.test("weeklyTemplate.buildSummaryPrompt includes guidance and articles", () => {
  const page1 = ScrapboxPage.reconstruct({
    projectName: "katayama8000",
    title: "2026/07/21",
    content: "Built feature A",
  });
  const page2 = ScrapboxPage.reconstruct({
    projectName: "katayama8000",
    title: "2026/07/22",
    content: "Fixed issue B",
  });

  const prompt = weeklyTemplate.buildSummaryPrompt([page1, page2]);

  assertStringIncludes(
    prompt,
    "write one connected summary in English",
  );
  assertStringIncludes(
    prompt,
    "Write exactly one paragraph with 4-6 sentences.",
  );
  assertStringIncludes(prompt, "overall weekly theme");
  assertStringIncludes(prompt, "Article 1: 2026/07/21");
  assertStringIncludes(prompt, "Article 2: 2026/07/22");
  assertStringIncludes(prompt, "Return only the final summary paragraph.");
});

Deno.test("PostWeeklyBlogUseCase.execute uses listPages result without title-based refetch", async () => {
  const today = new Date("2026-07-22T00:00:00Z");
  const dayjs = DateProviderImpl.getDayjs();
  const weekStart = dayjs(today).subtract(dayjs(today).day() - 1, "day");

  const dailyPageMap = new Map<string, ScrapboxPage>();
  for (let i = 0; i < 7; i++) {
    const current = weekStart.add(i, "day");
    const title = formatDate(current, "yyyy/M/d (ddd)");
    dailyPageMap.set(
      title,
      ScrapboxPage.reconstruct({
        projectName: "katayama8000",
        title,
        content:
          "Wake-up Time\n7:00\nScore sleep quality\n4\nDaily note content",
      }),
    );
  }

  const weeklySourcePages = [
    ScrapboxPage.reconstruct({
      projectName: "katayama8000",
      title: "feature-log",
      content: "Implemented weekly aggregation",
      createdAt: new Date("2026-07-21T09:00:00Z"),
    }),
    ScrapboxPage.reconstruct({
      projectName: "katayama8000",
      title: "bugfix-log",
      content: "Fixed summary prompt issues",
      createdAt: new Date("2026-07-22T11:00:00Z"),
    }),
    ScrapboxPage.reconstruct({
      projectName: "katayama8000",
      title: "old-log",
      content: "Should not be included",
      createdAt: new Date("2026-07-10T11:00:00Z"),
    }),
  ];

  const postedPages: ScrapboxPage[] = [];
  let listPagesByPageTitleCallCount = 0;
  let capturedPrompt = "";

  const repository: ScrapboxRepository = {
    post: (page) => {
      postedPages.push(page);
      return Promise.resolve();
    },
    update: () => Promise.resolve(),
    exists: () => Promise.resolve(false),
    getPage: (_projectName, title) =>
      Promise.resolve(dailyPageMap.get(title) ?? null),
    getPageCount: () => Promise.resolve(null),
    listPages: () => Promise.resolve(weeklySourcePages),
    listPagesByPageTitle: () => {
      listPagesByPageTitleCallCount += 1;
      return Promise.resolve([]);
    },
  };

  const dateProvider: DateProvider = {
    now: () => today,
  };

  const aiProvider: GenerativeAIProvider = {
    generateContentJa: () => Promise.resolve(""),
    generateContentEn: (prompt) => {
      capturedPrompt = prompt;
      return Promise.resolve("Connected weekly summary");
    },
  };

  const wakeUpUseCase = new CalculateAverageWakeUpTimeUseCase(
    repository,
    dateProvider,
  );
  const sleepQualityUseCase = new CalculateAverageSleepQualityUseCase(
    repository,
    dateProvider,
  );
  const useCase = new PostWeeklyBlogUseCase(
    repository,
    dateProvider,
    wakeUpUseCase,
    sleepQualityUseCase,
    aiProvider,
  );

  await useCase.execute("katayama8000");

  assertEquals(listPagesByPageTitleCallCount, 0);
  assertEquals(postedPages.length, 1);
  assertStringIncludes(capturedPrompt, "Article 1: feature-log");
  assertStringIncludes(capturedPrompt, "Article 2: bugfix-log");
  assertEquals(capturedPrompt.includes("old-log"), false);
  assertStringIncludes(postedPages[0].getContent(), "Connected weekly summary");
});
