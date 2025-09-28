/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import { PostSleepLogUseCase } from "@/application/use-cases/sleepLog.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";

const main = async () => {
  const sessionId = Deno.env.get("SCRAPBOX_SID");
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    Deno.exit(1);
  }

  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const dateProvider = new DateProviderImpl();

  const postSleepLogUseCase = new PostSleepLogUseCase(
    scrapboxRepository,
    dateProvider,
  );

  try {
    await postSleepLogUseCase.execute("katayama8000");
  } catch (error) {
    console.error("Failed to post sleep log:", error);
    Deno.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
