
import "dotenv/config";
import { PostDailyBlogUseCase, PostWeeklyBlogUseCase } from "@/application/use-cases/blog";
import { CalculateAverageWakeUpTimeUseCase } from "@/application/use-cases/average_wake_up_time";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl";

const main = async () => {
  const command = process.argv[2];
  if (command !== 'daily' && command !== 'weekly') {
    console.error("Usage: yarn <daily|weekly>");
    process.exit(1);
  }

  const sessionId = process.env.SCRAPBOX_SID;
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    process.exit(1);
  }

  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const dateProvider = new DateProviderImpl();

  if (command === 'daily') {
    const postDailyBlogUseCase = new PostDailyBlogUseCase(scrapboxRepository, dateProvider);
    try {
      await postDailyBlogUseCase.execute("katayama8000");
      console.log('Successfully posted daily blog.');
    } catch (error) {
      console.error("Failed to post daily blog:", error);
      process.exit(1);
    }
  } else if (command === 'weekly') {
    const calculateAverageWakeUpTimeUseCase = new CalculateAverageWakeUpTimeUseCase(scrapboxRepository, dateProvider);
    const postWeeklyBlogUseCase = new PostWeeklyBlogUseCase(scrapboxRepository, dateProvider, calculateAverageWakeUpTimeUseCase);
    try {
      await postWeeklyBlogUseCase.execute("katayama8000");
      console.log('Successfully posted weekly blog.');
    } catch (error) {
      console.error("Failed to post weekly blog:", error);
      process.exit(1);
    }
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
