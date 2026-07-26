import { assertEquals, assertStringIncludes } from "std/assert/mod.ts";
import { weeklyTemplate } from "./post-weekly-blog.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";

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
