
import "dotenv/config";
import { CalculateAverageWakeUpTimeUseCase } from "@/application/use-cases/average_wake_up_time";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl";

const main = async () => {
  const sessionId = process.env.SCRAPBOX_SID;
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    process.exit(1);
  }

  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const dateProvider = new DateProviderImpl();

  const calculateAverageWakeUpTimeUseCase = new CalculateAverageWakeUpTimeUseCase(
    scrapboxRepository,
    dateProvider
  );

  try {
    const averageWakeUpTime = await calculateAverageWakeUpTimeUseCase.execute("katayama8000");
    console.log("Average wake up time:", averageWakeUpTime);
  } catch (error) {
    console.error("Failed to calculate average wake up time:", error);
    process.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
