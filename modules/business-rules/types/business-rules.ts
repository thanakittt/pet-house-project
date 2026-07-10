export type TimeRange = {
  startTime: string;
  endTime: string;
};

export type WeeklyBusinessHours = {
  dayOfWeek: number;
  intervals: TimeRange[];
};

export type BusinessDateOverride = {
  date: string;
  isClosed: boolean;
  intervals: TimeRange[];
};

export type BusinessRules = {
  minBookingLeadMinutes: number;
  maxAdvanceBookingDays: number;
  slotIntervalMinutes: number;
  weeklyHours: WeeklyBusinessHours[];
  dateOverrides: BusinessDateOverride[];
};

export type OperatingInterval = TimeRange;

export const DAY_OF_WEEK_LABELS = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
] as const;
