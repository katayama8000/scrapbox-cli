
import { DateProvider } from "@/application/ports/date-provider.ts";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export class DateProviderImpl implements DateProvider {
  now(): Date {
    return dayjs("2025-10-12").toDate();
  }

  // You can add other date-related methods here, using dayjs
  static getDayjs() {
    return dayjs;
  }
}

