import {
  APP_TIME_ZONE,
  formatDateOnly,
  getBangkokDateAtTime,
  getBangkokDayOfWeek,
  getBangkokDayRange,
  getBangkokTodayString,
} from "@/lib/finance/date";

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

console.log("Bangkok date helper verification passed");
