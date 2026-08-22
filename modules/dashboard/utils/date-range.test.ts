import assert from "node:assert/strict";
import test from "node:test";
import { formatDateOnly } from "@/lib/finance/date";
import {
  getCanonicalCustomUrl,
  getPreviousFilterDateRange,
  resolveDashboardFilter,
} from "./date-range";

const BASE_DATE = new Date("2026-07-11T05:00:00.000Z");

test("resolves presets from a Bangkok calendar date", () => {
  const daily = resolveDashboardFilter({ period: "DAILY" }, BASE_DATE).filter;
  const monthly = resolveDashboardFilter({ period: "MONTHLY" }, BASE_DATE).filter;
  const yearly = resolveDashboardFilter({ period: "YEARLY" }, BASE_DATE).filter;

  assert.deepEqual([daily.startDateValue, daily.endDateValue], ["2026-07-11", "2026-07-11"]);
  assert.deepEqual([monthly.startDateValue, monthly.endDateValue], ["2026-06-12", "2026-07-11"]);
  assert.deepEqual([yearly.startDateValue, yearly.endDateValue], ["2026-01-01", "2026-12-31"]);
});

test("accepts custom ranges across years and leap day", () => {
  const result = resolveDashboardFilter(
    { period: "CUSTOM", from: "2024-02-29", to: "2025-01-02" },
    BASE_DATE,
  );

  assert.equal(result.needsCanonicalRedirect, false);
  assert.equal(result.filter.startDateValue, "2024-02-29");
  assert.equal(result.filter.endDateValue, "2025-01-02");
  assert.equal(result.filter.chartGranularity, "MONTH");
});

test("falls back to canonical 30 days for invalid custom URLs", () => {
  const invalidParams = [
    { period: "CUSTOM" },
    { period: "CUSTOM", from: "2026-02-30", to: "2026-03-01" },
    { period: "CUSTOM", from: "2026-07-10", to: "2026-07-09" },
    { period: "CUSTOM", from: "2026-07-10", to: "2026-07-12" },
  ];

  for (const params of invalidParams) {
    const result = resolveDashboardFilter(params, BASE_DATE);
    assert.equal(result.needsCanonicalRedirect, true);
    assert.equal(
      getCanonicalCustomUrl(result.filter),
      "/back-office/dashboard?period=CUSTOM&from=2026-06-12&to=2026-07-11",
    );
  }
});

test("creates an adjacent previous range with equal inclusive length", () => {
  const filter = resolveDashboardFilter(
    { period: "CUSTOM", from: "2026-07-10", to: "2026-07-11" },
    BASE_DATE,
  ).filter;
  const previous = getPreviousFilterDateRange(filter);

  assert.equal(formatDateOnly(previous.startDate), "2026-07-08");
  assert.equal(formatDateOnly(previous.endDate), "2026-07-09");
});

test("selects chart granularity at the agreed boundaries", () => {
  const granularity = (from: string, to: string) =>
    resolveDashboardFilter({ period: "CUSTOM", from, to }, BASE_DATE).filter.chartGranularity;

  assert.equal(granularity("2026-01-01", "2026-01-31"), "DAY");
  assert.equal(granularity("2026-01-01", "2026-02-01"), "MONTH");
  assert.equal(granularity("2024-01-01", "2025-12-31"), "MONTH");
  assert.equal(granularity("2024-01-01", "2026-01-01"), "YEAR");
});
