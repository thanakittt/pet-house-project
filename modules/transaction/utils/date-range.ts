import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { TransactionPeriod } from "../types/transaction";

export function getDateRangeFromPeriod(period: TransactionPeriod, baseDate: Date = new Date()): { startDate: Date | null; endDate: Date | null } {
  switch (period) {
    case "DAILY":
      return {
        startDate: startOfDay(baseDate),
        endDate: endOfDay(baseDate),
      };
    case "MONTHLY":
      return {
        startDate: startOfMonth(baseDate),
        endDate: endOfMonth(baseDate),
      };
    case "YEARLY":
      return {
        startDate: startOfYear(baseDate),
        endDate: endOfYear(baseDate),
      };
    case "ALL":
      return {
        startDate: null,
        endDate: null,
      };
    default:
      return {
        startDate: null,
        endDate: null,
      };
  }
}
