import { format } from "date-fns";

export function formatDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
