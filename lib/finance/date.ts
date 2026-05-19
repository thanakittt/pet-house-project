import { addDays, addMilliseconds } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIME_ZONE = "Asia/Bangkok";

export function formatDateOnly(date: Date): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "yyyy-MM-dd");
}

export function getBangkokTodayString(): string {
  return formatDateOnly(new Date());
}

export function getBangkokDayRange(dateString: string): {
  start: Date;
  end: Date;
} {
  const start = getBangkokDateAtTime(dateString, 0, 0);
  const end = addMilliseconds(addDays(start, 1), -1);

  return { start, end };
}

export function getBangkokDateAtTime(
  dateString: string,
  hour: number,
  minute: number = 0,
): Date {
  return fromZonedTime(
    `${dateString} ${formatTimePart(hour)}:${formatTimePart(minute)}:00.000`,
    APP_TIME_ZONE,
  );
}

export function getBangkokDayOfWeek(dateString: string): number {
  const date = getBangkokDateAtTime(dateString, 0, 0);
  const isoDayOfWeek = Number(formatInTimeZone(date, APP_TIME_ZONE, "i"));

  return isoDayOfWeek % 7;
}

function formatTimePart(value: number): string {
  return String(value).padStart(2, "0");
}
