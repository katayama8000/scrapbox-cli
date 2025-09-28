/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import { CalculateAverageWakeUpTimeUseCase } from "@/application/use-cases/average_wake_up_time.ts";
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

  const calculateAverageWakeUpTimeUseCase =
    new CalculateAverageWakeUpTimeUseCase(scrapboxRepository, dateProvider);

  try {
    const averageWakeUpTime = await calculateAverageWakeUpTimeUseCase.execute(
      "katayama8000",
    );
    console.log("Average wake up time:", averageWakeUpTime);
  } catch (error) {
    console.error("Failed to calculate average wake up time:", error);
    Deno.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
