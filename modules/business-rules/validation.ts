import { z } from "zod";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาต้องเป็น HH:mm");

export const timeRangeSchema = z
  .object({
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((range) => range.startTime < range.endTime, {
    message: "เวลาเริ่มต้องอยู่ก่อนเวลาสิ้นสุด",
    path: ["endTime"],
  });

export const weeklyBusinessHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  intervals: z.array(timeRangeSchema),
});

export const businessDateOverrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง"),
    isClosed: z.boolean(),
    intervals: z.array(timeRangeSchema),
  })
  .superRefine((override, context) => {
    if (!override.isClosed && override.intervals.length === 0) {
      context.addIssue({
        code: "custom",
        message: "วันเปิดพิเศษต้องมีเวลาเปิดทำการอย่างน้อยหนึ่งช่วง",
        path: ["intervals"],
      });
    }
  });

function validateNoOverlappingIntervals(
  intervals: { startTime: string; endTime: string }[],
  context: z.RefinementCtx,
  path: (string | number)[],
) {
  const sortedIntervals = [...intervals].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  sortedIntervals.forEach((interval, index) => {
    const previous = sortedIntervals[index - 1];
    if (previous && previous.endTime > interval.startTime) {
      context.addIssue({
        code: "custom",
        message: "ช่วงเวลาทำการต้องไม่ทับซ้อนกัน",
        path,
      });
    }
  });
}

export const updateBusinessRulesSchema = z
  .object({
    minBookingLeadMinutes: z.number().int().min(0).max(10_080),
    maxAdvanceBookingDays: z.number().int().min(1).max(365),
    slotIntervalMinutes: z.number().int().min(5).max(120),
    weeklyHours: z.array(weeklyBusinessHoursSchema).length(7),
    dateOverrides: z.array(businessDateOverrideSchema).max(365),
  })
  .superRefine((rules, context) => {
    const days = new Set<number>();
    rules.weeklyHours.forEach((day, index) => {
      if (days.has(day.dayOfWeek)) {
        context.addIssue({
          code: "custom",
          message: "กำหนดวันในตารางรายสัปดาห์ซ้ำกัน",
          path: ["weeklyHours", index, "dayOfWeek"],
        });
      }
      days.add(day.dayOfWeek);
      validateNoOverlappingIntervals(
        day.intervals,
        context,
        ["weeklyHours", index, "intervals"],
      );
    });

    const dates = new Set<string>();
    rules.dateOverrides.forEach((override, index) => {
      if (dates.has(override.date)) {
        context.addIssue({
          code: "custom",
          message: "กำหนดวันพิเศษซ้ำกัน",
          path: ["dateOverrides", index, "date"],
        });
      }
      dates.add(override.date);
      validateNoOverlappingIntervals(
        override.intervals,
        context,
        ["dateOverrides", index, "intervals"],
      );
    });
  });

export type UpdateBusinessRulesInput = z.infer<typeof updateBusinessRulesSchema>;
