/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import {
  PostDailyBlogUseCase,
  PostWeeklyBlogUseCase,
} from "@/application/use-cases/blog.ts";
import { CalculateAverageWakeUpTimeUseCase } from "@/application/use-cases/average_wake_up_time.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";

const main = async () => {
  const command = Deno.args[0];
  if (command !== "daily" && command !== "weekly") {
    console.error("Usage: deno task <daily|weekly>");
    Deno.exit(1);
  }

  const sessionId = Deno.env.get("SCRAPBOX_SID");
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    Deno.exit(1);
  }

  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const dateProvider = new DateProviderImpl();

  if (command === "daily") {
    const postDailyBlogUseCase = new PostDailyBlogUseCase(
      scrapboxRepository,
      dateProvider,
    );
    try {
      await postDailyBlogUseCase.execute("katayama8000");
      console.log("Successfully posted daily blog.");
    } catch (error) {
      console.error("Failed to post daily blog:", error);
      Deno.exit(1);
    }
  } else if (command === "weekly") {
    const calculateAverageWakeUpTimeUseCase =
      new CalculateAverageWakeUpTimeUseCase(scrapboxRepository, dateProvider);
    const postWeeklyBlogUseCase = new PostWeeklyBlogUseCase(
      scrapboxRepository,
      dateProvider,
      calculateAverageWakeUpTimeUseCase,
    );
    try {
      await postWeeklyBlogUseCase.execute("katayama8000");
      console.log("Successfully posted weekly blog.");
    } catch (error) {
      console.error("Failed to post weekly blog:", error);
      Deno.exit(1);
    }
  }
};

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
