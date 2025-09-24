import 'dotenv/config';
import { CountPagesUseCase } from '@/application/use-cases/count-pages';
import { ScrapboxRepositoryImpl } from '@/infrastructure/adapters/scrapbox/scrapbox-repository-impl';
import { DateProviderImpl } from '@/infrastructure/adapters/date/date-provider-impl';

const main = async () => {
  const sessionId = process.env.SCRAPBOX_SID;
  if (!sessionId) {
    console.error('Please set the SCRAPBOX_SID environment variable.');
    process.exit(1);
  }

  const projectName = 'katayama8000';
  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const dateProvider = new DateProviderImpl();

  const countPagesUseCase = new CountPagesUseCase(
    scrapboxRepository,
    dateProvider,
    projectName
  );

  try {
    const stats = await countPagesUseCase.getMonthlyStats();
    console.log(
      `Project '${projectName}' current page count: ${stats.currentCount}`
    );

    if (stats.previousCount !== null && stats.difference !== null) {
      const changeText =
        stats.difference >= 0 ? `+${stats.difference}` : `${stats.difference}`;
      console.log(
        `Previous month: ${stats.previousCount} pages (${changeText} change)`
      );
    } else {
      console.log('Previous month data: Not available');
    }

    await countPagesUseCase.postMonthlyPageCount();
    console.log('Successfully posted monthly page count statistics.');
  } catch (error) {
    console.error('Failed to post monthly page count statistics:', error);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
