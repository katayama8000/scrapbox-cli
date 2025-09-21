
import "dotenv/config";
import { PostSleepLogUseCase } from "@/application/use-cases/sleepLog";
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

  const postSleepLogUseCase = new PostSleepLogUseCase(
    scrapboxRepository,
    dateProvider
  );

  try {
    await postSleepLogUseCase.execute("katayama8000");
  } catch (error) {
    console.error("Failed to post sleep log:", error);
    process.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
