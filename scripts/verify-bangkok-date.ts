import {
  APP_TIME_ZONE,
  formatDateOnly,
  getBangkokDateAtTime,
  getBangkokDayOfWeek,
  getBangkokDayRange,
  getBangkokTodayString,
} from "@/lib/finance/date";
import { formatThaiDate, formatThaiDateTime, formatThaiTime } from "@/lib/utils";
import {
  normalizeAnnouncementInput,
  toDateTimeLocalValue,
} from "@/modules/announcement/types/announcement";

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

function assertMatch(value: string, pattern: RegExp, message: string) {
  if (!pattern.test(value)) {
    throw new Error(`${message}: ${value} does not match ${pattern}`);
  }
}

assertEqual(APP_TIME_ZONE, "Asia/Bangkok", "app timezone");

assertEqual(
  formatDateOnly(new Date("2026-05-18T18:30:00.000Z")),
  "2026-05-19",
  "formatDateOnly uses Bangkok calendar date",
);

assertMatch(
  getBangkokTodayString(),
  /^\d{4}-\d{2}-\d{2}$/,
  "Bangkok today string format",
);

const range = getBangkokDayRange("2026-05-19");
assertEqual(
  range.start.toISOString(),
  "2026-05-18T17:00:00.000Z",
  "Bangkok day start",
);
assertEqual(
  range.end.toISOString(),
  "2026-05-19T16:59:59.999Z",
  "Bangkok day end",
);

assertEqual(
  getBangkokDateAtTime("2026-05-19", 9, 0).toISOString(),
  "2026-05-19T02:00:00.000Z",
  "Bangkok 09:00 instant",
);

assertEqual(
  getBangkokDayOfWeek("2026-05-20"),
  3,
  "Bangkok day of week for Wednesday",
);
assertEqual(
  formatThaiDate("2026-05-23").endsWith("2026"),
  true,
  "date-only Thai date display keeps calendar year",
);
assertEqual(
  formatThaiDate("2026-05-23").startsWith("23 "),
  true,
  "date-only Thai date display keeps calendar day",
);

const announcementInput = normalizeAnnouncementInput({
  title: "Vercel timezone check",
  content: "Ensure datetime-local uses Bangkok time",
  type: "NEWS",
  startDisplayAt: "2026-05-23T18:30",
  endDisplayAt: "",
  isActive: true,
});

if (!announcementInput.success) {
  throw new Error(announcementInput.error);
}

assertEqual(
  announcementInput.data.startDisplayAt.toISOString(),
  "2026-05-23T11:30:00.000Z",
  "announcement start datetime-local parses as Bangkok time",
);
assertEqual(
  announcementInput.data.endDisplayAt,
  null,
  "empty announcement end datetime-local stays null",
);
assertEqual(
  toDateTimeLocalValue(announcementInput.data.startDisplayAt),
  "2026-05-23T18:30",
  "announcement datetime-local display uses Bangkok time",
);
assertEqual(
  formatThaiDateTime(announcementInput.data.startDisplayAt).endsWith("18:30"),
  true,
  "Thai datetime display uses Bangkok time",
);
assertEqual(
  formatThaiTime("2026-05-19T02:00:00.000Z"),
  "09:00",
  "Thai time display uses Bangkok time for morning appointment",
);
assertEqual(
  formatThaiTime("2026-05-19T11:30:00.000Z"),
  "18:30",
  "Thai time display uses Bangkok time for evening appointment",
);
assertEqual(formatThaiTime(null), "-", "Thai time display handles null input");
assertEqual(
  formatThaiTime("invalid-date"),
  "-",
  "Thai time display handles invalid input",
);

const invalidRangeInput = normalizeAnnouncementInput({
  title: "Invalid range",
  content: "End must be after start",
  type: "NEWS",
  startDisplayAt: "2026-05-23T18:30",
  endDisplayAt: "2026-05-23T18:30",
  isActive: true,
});

assertEqual(
  invalidRangeInput.success,
  false,
  "announcement end datetime must be after start datetime",
);

console.log("Bangkok date helper verification passed");
